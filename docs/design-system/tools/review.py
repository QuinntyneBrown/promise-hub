"""Capture design-review evidence using Chromium, not application behavior tests.

Requires Python playwright and Pillow. Screenshots and measurements stay in .cache/.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.cache/shots'
OUT.mkdir(parents=True, exist_ok=True)
SELECTED = ['index.html','components/button.html','components/roster.html','components/dialog.html','foundations/color.html']
MOCKS = ['pages/today/default.html','pages/check-in/default.html','pages/quick-card/default.html','pages/slip-sign/default.html','dialogs/add-family/default.html']
results=[]
images=[]

with sync_playwright() as p:
    browser=p.chromium.launch()
    for width in [360,1280]:
        for theme in ['light','dark']:
            page=browser.new_page(viewport={'width':width,'height':900},color_scheme=theme)
            for file in [ROOT/'index.html']+sorted(ROOT.glob('foundations/*.html'))+sorted(ROOT.glob('components/*.html'))+sorted(ROOT.glob('patterns/*.html')):
                errors=[]
                page.on('pageerror',lambda error: errors.append(str(error)))
                page.goto(file.as_uri()+f'?theme={theme}',wait_until='load')
                info=page.evaluate('''() => ({
                  overflow: document.documentElement.scrollWidth > innerWidth + 1,
                  width: document.documentElement.scrollWidth,
                  contrastFailures: document.querySelectorAll('[data-contrast][data-pass="false"]').length,
                  unsetTokens: [...document.querySelectorAll('[data-token]')].filter(e=>e.textContent==='(unset)').length,
                  duplicateIds: [...new Set([...document.querySelectorAll('[id]')].map(e=>e.id).filter((v,i,a)=>a.indexOf(v)!==i))],
                })''')
                info.update(file=file.relative_to(ROOT).as_posix(),viewport=width,theme=theme,scriptErrors=errors)
                results.append(info)
                if info['file'] in SELECTED:
                    # Skip repeated navigation so the narrow screenshot includes the actual component.
                    page.locator('#main').evaluate('(e)=>e.scrollIntoView({behavior:"instant"})')
                    page.screenshot(path=str(OUT/f'{file.stem}-{width}-{theme}.png'))
                    images.append((OUT/f'{file.stem}-{width}-{theme}.png',info['file'],width,theme))
                    if info['file']=='components/button.html':
                        page.locator('#states details').nth(0 if theme=='light' else 1).evaluate('(e)=>e.open=true')
                        page.locator('#states').evaluate('(e)=>e.scrollIntoView({behavior:"instant"})')
                        page.screenshot(path=str(OUT/f'button-states-{width}-{theme}.png'))
            for rel in MOCKS:
                file=ROOT.parent/'mocks'/rel
                if not file.exists():continue
                page.goto(file.as_uri()+f'?theme={theme}&chrome=0')
                page.wait_for_timeout(100)
                page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(OUT/f'mock-{file.parent.name}-{width}-{theme}.png'))
                results.append(dict(file='mocks/'+rel,viewport=width,theme=theme,overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+1')))
            page.close()
    # Inspect focus and preferences in real documentation controls.
    page=browser.new_page(viewport={'width':360,'height':900})
    page.goto((ROOT/'components/button.html').as_uri()+'?theme=dark')
    page.keyboard.press('Tab')
    focus=page.evaluate('({text:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle})')
    page.emulate_media(reduced_motion='reduce',forced_colors='active')
    preferences=page.evaluate('({duration:getComputedStyle(document.documentElement).getPropertyValue("--duration-base"),focus:getComputedStyle(document.documentElement).getPropertyValue("--color-focus-ring")})')
    browser.close()

(OUT.parent/'review.json').write_text(json.dumps({'pages':results,'focus':focus,'preferences':preferences},indent=2),encoding='utf-8')
problems=[r for r in results if r.get('overflow') or r.get('contrastFailures') or r.get('unsetTokens') or r.get('duplicateIds') or r.get('scriptErrors')]
print(json.dumps({'checks':len(results),'problems':problems,'focus':focus,'preferences':preferences},indent=2))

# Review sheets preserve readable 360px phone previews and 640px desktop previews.
for width in [360,1280]:
    group=[row for row in images if row[2]==width]
    cellw=360 if width==360 else 640
    cellh=940 if width==360 else 490
    sheet=Image.new('RGB',(cellw*2,cellh*5),'#eeeeee')
    draw=ImageDraw.Draw(sheet)
    for i,(path,title,_,theme) in enumerate(group):
        im=Image.open(path).convert('RGB');im.thumbnail((cellw,cellh-30))
        x=(i%2)*cellw;y=(i//2)*cellh
        draw.text((x+8,y+6),title+' / '+theme,fill='#111111')
        sheet.paste(im,(x,y+30))
    sheet.save(OUT/f'contact-{width}.png')
