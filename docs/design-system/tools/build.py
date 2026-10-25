"""Regenerate the browsable PromiseHub design system from the checked HTML mocks.

Run from the repository root: python docs/design-system/tools/build.py
Requires beautifulsoup4. Token and component CSS remain hand-maintained sources.
"""
from __future__ import annotations

import copy
import html
import json
import re
from collections import defaultdict
from pathlib import Path

from bs4 import BeautifulSoup
from catalog import COMPONENTS, FOUNDATIONS, PATTERNS, EXTRA_VARIANTS, EXTRA_STATES, KEYBOARD

ROOT = Path(__file__).resolve().parents[1]
MOCKS = ROOT.parent / 'mocks'
E = html.escape
CSS = (ROOT / 'assets/components.css').read_text(encoding='utf-8')
TOKENS = (ROOT / 'tokens/tokens.css').read_text(encoding='utf-8')
PAIRS = json.loads((ROOT / 'tokens/contrast-pairs.json').read_text(encoding='utf-8'))['pairs']
TOKEN_NAMES = list(dict.fromkeys(re.findall(r'(--[\w-]+)\s*:', TOKENS)))
MANIFEST = json.loads((MOCKS / 'manifest.json').read_text(encoding='utf-8'))
SCREEN_COUNT = len(MANIFEST['screens'])
SOURCES = defaultdict(list)
SAMPLES = defaultdict(dict)
VARIANTS = defaultdict(set)
uid = 0


def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text.rstrip() + '\n', encoding='utf-8')


def table(heads, rows):
    return '<div class="ds-table-wrap" tabindex="0" role="region" aria-label="Scrollable reference table"><table class="ds-table"><thead><tr>' + ''.join(f'<th scope="col">{h}</th>' for h in heads) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>' for row in rows) + '</tbody></table></div>'


def section(ident, content, title=None, na=None):
    attr = f' data-na="{E(na)}"' if na else ''
    return f'<section class="ds-section" id="{ident}"{attr}><h2><a href="#{ident}">{title or ident.replace("-", " ").capitalize()}</a></h2>{content}</section>'


def nav(prefix):
    groups = [('Foundations', [('foundations/' + n + '.html', n.replace('-', ' ').title()) for n in FOUNDATIONS]),
              ('Components', [('components/' + c['slug'] + '.html', c['title']) for c in COMPONENTS]),
              ('Patterns', [('patterns/' + n + '.html', v[0]) for n, v in PATTERNS.items()])]
    return f'<nav class="ds-nav" aria-label="Design system"><div class="ds-nav__brand"><a href="{prefix}index.html">PromiseHub</a><button class="ds-theme-toggle" type="button" aria-pressed="false">Dark theme</button></div>' + ''.join(f'<details open><summary>{title}</summary><ul>' + ''.join(f'<li><a href="{prefix}{path}">{label}</a></li>' for path, label in links) + '</ul></details>' for title, links in groups) + '</nav>'


def page(path, title, lead, body, category):
    prefix = '../' if '/' in path else ''
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)} — PromiseHub design system</title><meta name="description" content="{E(lead)}">
<link rel="stylesheet" href="{prefix}tokens/tokens.css"><link rel="stylesheet" href="{prefix}assets/components.css"><link rel="stylesheet" href="{prefix}assets/ds.css"></head>
<body><a class="skip-link" href="#main">Skip to content</a><div class="ds-shell">{nav(prefix)}
<main class="ds-main" id="main"><header class="ds-header"><p class="ds-kicker">PromiseHub · {category}</p><h1>{E(title)}</h1><p class="ds-lead">{E(lead)}</p><div class="ds-meta"><span class="ds-pill">Extracted 25 October 2026</span><span class="ds-pill ds-pill--ok">Light + dark contrast verified</span></div></header>
{body}<footer class="ds-footer"><span>PromiseHub design system · <a href="{prefix}../mocks/index.html">Source mocks</a></span><a href="#main">Back to content</a></footer></main></div><script src="{prefix}assets/ds.js"></script></body></html>'''


# Read default evidence first; then collect modifiers and additional states from all 492 mocks.
files = sorted((p for p in MOCKS.rglob('*.html') if '.cache' not in p.parts and p.parent != MOCKS), key=lambda p: (p.name != 'default.html', str(p)))
for file in files:
    soup = BeautifulSoup(file.read_text(encoding='utf-8'), 'html.parser')
    for c in COMPONENTS:
        if not c['selector']:
            continue
        nodes = soup.select(c['selector'])
        if not nodes:
            continue
        slug = c['slug']
        SOURCES[slug].append(file)
        if 'default' not in SAMPLES[slug]:
            SAMPLES[slug]['default'] = (copy.copy(nodes[0]), file)
        for node in nodes:
            for cls in node.get('class', []):
                if '--' in cls:
                    base, variant = cls.split('--', 1)
                    if '.' + base in c['selector']:
                        VARIANTS[slug].add(variant)
                        SAMPLES[slug].setdefault(variant, (copy.copy(node), file))


def fallback(slug, variant='default'):
    samples = {
        'button': '<button class="btn" type="button">Save changes</button>',
        'button-group': '<div role="group" aria-label="Session days" class="cluster"><button type="button" class="btn" aria-pressed="true">Monday</button><button type="button" class="btn" aria-pressed="false">Wednesday</button></div>',
        'link': '<a href="#sources">View source mocks</a>',
        'text-field': '<label class="field"><span class="field__label">Guardian email</span><input class="input" type="email" autocomplete="email" value="carmen.rivera@example.com"><span class="field__hint">We will send permission slips here.</span></label>',
        'textarea': '<label class="field"><span class="field__label">Message to guardians</span><textarea class="textarea" rows="3">Please bring a water bottle to the museum trip.</textarea><span class="field__hint">Keep personal medical information out of group messages.</span></label>',
        'select': '<label class="field"><span class="field__label">Preferred language</span><select class="select"><option>English</option><option>Español</option><option>Français</option></select></label>',
        'checkbox': '<label class="choice"><input type="checkbox"><span>I have read the trip details.</span></label>',
        'radio-group': '<fieldset class="stack"><legend>Contact preference</legend><label class="choice"><input type="radio" name="contact" checked><span>Email</span></label><label class="choice"><input type="radio" name="contact"><span>SMS</span></label></fieldset>',
        'switch': '<label class="switch"><input type="checkbox" role="switch"><span>Receive event reminders</span></label>',
        'date-picker': '<label class="field"><span class="field__label">Event date</span><input class="input" type="date" value="2026-11-05"></label>',
        'file-upload': '<label class="dropzone"><span>Choose a roster CSV</span><input type="file" accept=".csv"></label>',
        'form-layout': '<form class="stack"><label class="field"><span>Guardian name</span><input class="input" autocomplete="name"></label><div class="form-actions"><button class="btn" type="button">Cancel</button><button class="btn btn--primary" type="submit">Save guardian</button></div></form>',
        'sidebar-navigation': '<nav aria-label="Staff sections"><ul class="list"><li><a class="nav-link" href="#overview" aria-current="page">Today</a></li><li><a class="nav-link" href="#sources">Households</a></li></ul></nav>',
        'pagination': '<nav aria-label="Household pages" class="cluster"><button type="button" class="btn" disabled>Previous</button><a class="btn" href="#overview" aria-current="page">1</a><a class="btn" href="#overview">2</a><button type="button" class="btn">Next</button></nav>',
        'tooltip': '<span class="tooltip-anchor"><button class="btn" type="button" aria-describedby="tip">Medical flag help</button><span class="tooltip" role="tooltip" id="tip">Open the Quick Card for details.</span></span>',
        'spinner': '<span class="cluster" role="status"><span class="spinner" aria-hidden="true"></span><span>Loading households…</span></span>',
        'divider': '<div class="divider">or</div>',
        'progress-bar': '<div class="stack"><span>Roster import: 65%</span><div class="progress" role="progressbar" aria-label="Roster import" aria-valuemin="0" aria-valuemax="100" aria-valuenow="65"><div class="progress__bar" style="--value:65%"></div></div></div>',
    }
    return samples.get(slug, '<p>See the linked source mock for the composed screen.</p>')


def specimen(c, variant='default', state='default', size=None):
    global uid
    uid += 1
    slug = c['slug']
    controlled = slug in {'button','button-group','link','text-field','textarea','select','checkbox','radio-group','switch','date-picker','file-upload','form-layout','sidebar-navigation','pagination','tooltip','spinner','progress-bar','divider'}
    if controlled:
        soup = BeautifulSoup(fallback(slug, variant), 'html.parser')
        source = SOURCES[slug][0] if SOURCES[slug] else None
    else:
        item = SAMPLES[slug].get(variant, SAMPLES[slug].get('default'))
        if not item:
            raise ValueError('No evidence or designed core specimen for ' + slug)
        node, source = item
        soup = BeautifulSoup(str(node), 'html.parser')
    for tag in soup.select('h1'):
        tag.name = 'h3'
    # Scope all IDs, label references and radio names per specimen, including theme pairs.
    ids = {x['id']: f'ex-{uid}-{x["id"]}' for x in soup.select('[id]')}
    for tag in soup.find_all(True):
        if tag.has_attr('id'):
            tag['id'] = ids[tag['id']]
        for attr in ['for','aria-labelledby','aria-describedby','aria-controls','aria-activedescendant']:
            if tag.has_attr(attr):
                tag[attr] = ' '.join(ids.get(x,x) for x in tag[attr].split())
        if tag.has_attr('name'):
            tag['name'] = f'ex-{uid}-' + tag['name']
        if tag.has_attr('autofocus'):
            del tag['autofocus']
        if tag.name == 'a':
            href = tag.get('href', '')
            if href.startswith(('tel:','mailto:','https:','http:')):
                pass
            elif href.startswith('#'):
                tag['href'] = '#' + ids.get(href[1:], 'sources')
            elif source and href:
                target = (source.parent / href.split('?')[0].split('#')[0]).resolve()
                if target.exists() and target.is_file():
                    tag['href'] = '../../mocks/' + target.relative_to(MOCKS.resolve()).as_posix()
                else:
                    tag['href'] = '#sources'
            else:
                tag['href'] = '#sources'
        if tag.has_attr('aria-modal'):
            del tag['aria-modal']
            tag['role'] = 'group'
        if tag.name == 'dialog':
            tag.name = 'div'
            tag['role'] = 'group'
        if 'dialog' in tag.get('class', []):
            tag['class'] = tag.get('class', []) + ['dialog--static']
        # Specimens stay in document flow; production positioning remains in components.css.
        if any(x in tag.get('class', []) for x in ['topbar','tabbar','nav-drawer','bulk-bar','push','bell-panel','toast']):
            tag['class'] = tag.get('class', []) + ['ds-in-flow']
        if tag.name == 'button' and not tag.has_attr('type'):
            tag['type'] = 'button'
    target = soup.select_one('button,input,textarea,select,a,summary') or soup.find(True)
    # For buttons and fields the variants are explicit native examples, rather than invented wrappers.
    base = c['selector'].split(':')[0].lstrip('.') if c['selector'].startswith('.') else ''
    if variant != 'default' and base and '--' not in base and ' ' not in base and not controlled:
        top = soup.find(True)
        top['class'] = list(dict.fromkeys(top.get('class', []) + [base + '--' + variant]))
    if slug == 'button':
        target['class'] = ['btn'] + ([] if variant in ['default','secondary'] else ['btn--' + variant])
        if variant == 'icon':
            target['aria-label'] = 'Add child'
            target.string = '+'
        if size:
            target['class'] += ['btn--' + size] if size != 'md' else []
    elif slug == 'text-field':
        target['type'] = variant if variant in ['text','email','password','number','search'] else 'text'
        if variant == 'number': target['value'] = '12'
        if variant == 'search': target['value'] = 'Rivera'
        if variant in ['prefix','suffix']:
            extra=soup.new_tag('span');extra.string='days' if variant=='suffix' else '+1';target.insert_after(extra) if variant=='suffix' else target.insert_before(extra)
        if variant=='counter':
            target['maxlength']='80';counter=soup.new_tag('span');counter.string='24 of 80 characters';target.insert_after(counter)
    elif slug in ['textarea','select'] and size:
        target['class'] = target.get('class', []) + ['input--' + size]
    if slug == 'spinner' and size:
        spin=soup.select_one('.spinner');spin['class']+=['spinner--'+size]
    if slug == 'avatar' and size:
        soup.find(True)['class']+=['avatar--'+size] if size!='md' else []
    if slug == 'dialog' and size:
        panel=soup.select_one('.dialog__panel')
        if panel: panel['class']+=['dialog__panel--'+size]
    if slug in ['text-field','textarea','select'] and size:
        target['class'] = list(dict.fromkeys(target.get('class', [])+['input--'+size]))
    if slug=='radio-group' and variant in ['horizontal','card']:
        soup.find(True)['class']=['cluster' if variant=='horizontal' else 'stack']
        if variant=='card':
            for label in soup.select('label'):label['class']=['choice','choice--tile']
    if slug in ['checkbox','switch'] and variant in ['description','group']:
        desc=soup.new_tag('small');desc.string='Updates for your enrolled programs only.';soup.find(True).append(desc)
        if variant=='group':
            group=soup.new_tag('fieldset');legend=soup.new_tag('legend');legend.string='Contact channels';group.append(legend);soup.find(True).wrap(group)
    if slug=='switch' and variant=='on':target['checked']=''
    if slug=='textarea' and variant=='counter':
        target['maxlength']='500';counter=soup.new_tag('span');counter.string='70 of 500 characters';target.insert_after(counter)
    if slug=='link':
        if variant=='external':target['href']='https://www.w3.org/WAI/';target['target']='_blank';target['rel']='noopener';target.string='Accessibility guidance (opens in new tab)'
        elif variant=='standalone':target['class']=['btn','btn--link'];target.string='View household →'
    if slug=='pagination' and variant=='page-size':
        label=soup.new_tag('label');label.string='Households per page ';select=soup.new_tag('select');select['class']=['select'];option=soup.new_tag('option');option.string='25';select.append(option);label.append(select);soup.find(True).append(label)
    if slug=='progress-bar' and variant in ['success','danger']:
        soup.select_one('.progress')['class']+=['progress--'+variant]
    if slug=='table':
        if variant=='dense':soup.find(True)['class']+=['table--dense']
        if variant=='sticky-header':soup.find(True)['class']+=['table--sticky']
        if variant=='sortable':
            th=soup.select_one('th')
            if th:
                th['aria-sort']='ascending';label=th.get_text(' ',strip=True);th.clear();b=soup.new_tag('button',type='button');b['class']=['btn','btn--ghost'];b.string=label+' ↑';th.append(b)
        if variant=='selectable':
            for row in soup.select('tr'):
                cell=soup.new_tag('th' if row.find('th') else 'td');choice=soup.new_tag('input',type='checkbox');choice['aria-label']='Select '+row.get_text(' ',strip=True)[:70];cell.append(choice);row.insert(0,cell)
    if slug=='dialog' and variant=='danger':
        title=soup.select_one('.dialog__title')
        if title:title.string='Delete this record?'
        for b in soup.select('.btn--primary'):b['class']=['btn','btn--danger'];b.string='Delete record'
    if slug in ['empty-state','error-page'] and variant!='default':
        messages={'first-run':('No children enrolled yet','Add a child to start building your roster.'),'no-results':('No matching households','Clear the filters to see all households.'),'forbidden':('You do not have access','Ask your organization administrator for access.'),'error':('We could not load this list','Check your connection and try again.'),'404':('Page not found','Return to Today to continue.'),'403':('You do not have access','Ask your organization administrator for access.'),'500':('We could not load this page','Try again. Support reference: PH-DEMO.'),'offline':('You are offline','Reconnect to refresh this information.'),'maintenance':('We are making an update','Please return in a few minutes.')}
        if variant in messages:
            heading=soup.select_one('h2,h3,.empty__title');description=soup.select_one('p,.empty__text')
            if heading:heading.string=messages[variant][0]
            if description:description.string=messages[variant][1]
    if slug == 'select' and variant == 'placeholder':
        option = soup.new_tag('option', value='');option.string = 'Choose a language';option['selected']='';target.insert(0, option)
    if slug == 'chip':
        if variant == 'filter':
            target.name='button';target['type']='button';target['aria-pressed']='false'
        elif variant == 'removable':
            remove=soup.new_tag('button',type='button');remove['class']=['chip__remove'];remove['aria-label']='Remove selected program';remove.string='×';soup.find(True).append(remove)
    if slug == 'avatar' and variant == 'image':
        top=soup.find(True);top['role']='img';top['aria-label']='Mateo Rivera';top.string='MR' # initials are the documented image-failure fallback
    if slug == 'progress-bar' and (variant == 'indeterminate' or state in ['loading','busy']):
        progress=soup.select_one('[role=progressbar]');progress.attrs.pop('aria-valuenow',None);progress['aria-label']='Importing roster';progress['class']+=['progress--indeterminate']
    if slug == 'tooltip' and state != 'default':
        soup.find(True)['data-state']='open'
    if slug in ['badge','status'] and variant in ['neutral','info','success','warning','danger']:
        top=soup.find(True);top['class']=[('badge' if slug=='badge' else 'status')]+([slug+'--'+variant] if variant!='neutral' else []);top.string={'neutral':'Pending','info':'Information','success':'Complete','warning':'Needs attention','danger':'Action required'}[variant]
    if slug == 'skeleton':
        soup.find(True)['aria-hidden']='true'
    if state in ['hover','focus','active']:
        target['data-state']=state
    elif state == 'disabled':
        if target.name in ['button','input','textarea','select']:target['disabled']=''
        elif target.name=='a':target['aria-disabled']='true';target.attrs.pop('href',None)
    elif state in ['loading','busy']:
        target['aria-busy']='true'
    elif state=='invalid':
        target['aria-invalid']='true'
        error=soup.new_tag('span',id=f'ex-{uid}-error');error['class']=['field__error'];error.string='Enter a valid value before continuing.';target['aria-describedby']=error['id'];target.insert_after(error)
    elif state=='read-only' and target.name in ['input','textarea']:
        target['readonly']=''
    elif state=='required' and target.name in ['input','select','textarea']:
        target['required']=''
    elif state in ['checked','indeterminate'] and target.name=='input':
        target['checked']=''
        if state=='indeterminate':target['data-indeterminate']='true'
    elif state in ['pressed','selected']:
        if target.name=='button':target['aria-pressed']='true'
        else:soup.find(True)['data-state']='selected'
    elif state in ['open','expanded']:
        if target.name in ['button','summary']:target['aria-expanded']='true'
        details=soup.select_one('details')
        if details:details['open']=''
    elif state!='default':
        soup.find(True)['data-state']=state
        # Existing component modifiers provide the real visual attendance/signature states.
        if slug=='roster':
            row=soup.select_one('.roster__item')
            if row:row['class']=['roster__item','roster__item--'+state]
    if slug=='table':
        wrap=soup.new_tag('div');wrap['class']=['table-wrap'];wrap['tabindex']='0';wrap['role']='region';wrap['aria-label']='Scrollable household table';soup.find(True).wrap(wrap)
    if slug=='wizard':
        wrap=soup.new_tag('div');wrap['class']=['onboarding'];soup.find(True).wrap(wrap)
    return str(soup)


def variants(c):
    return list(dict.fromkeys(['default'] + EXTRA_VARIANTS.get(c['slug'], []) + sorted(VARIANTS[c['slug']])))


def source_list(c):
    files = list(dict.fromkeys(SOURCES[c['slug']]))[:5]
    if files:
        return '<ul>' + ''.join(f'<li><a href="../../mocks/{p.relative_to(MOCKS).as_posix()}">{p.relative_to(MOCKS).as_posix()}</a></li>' for p in files) + '</ul>'
    return '<p>Core catalogue addition, not present in current product mocks. Designed from existing control heights, surfaces and focus tokens; see <a href="../../mocks/index.html">the mock inventory</a>. No new product workflow is implied.</p>'


def token_table(names):
    return table(['Token','Light','Dark'], [[f'<code>{n}</code>',f'<span data-theme="light" data-token="{n}"></span>',f'<span data-theme="dark" data-token="{n}"></span>'] for n in names])


def do_dont(c):
    return '<div class="ds-dodont">' + ''.join(f'<figure class="{kind}"><div class="ds-example__canvas"><code>{E(sample)}</code></div><figcaption>{caption}</figcaption></figure>' for kind,sample,caption in [
        ('ds-do', c['selector'] or c['slug'], f'Reuse the documented {E(c["title"].lower())} class. PromiseHub-only styles were promoted from mocks/assets/ui.css so all sources now share one definition.'),
        ('ds-dont', 'A second definition in a feature stylesheet', 'Do not recreate the split ownership found between the inherited kit and ui.css. Extend the shared component first.'),
        ('ds-do', 'var(--layout-gutter), var(--target-comfortable)', 'Use named dimensions and the shared 44px control target. The extraction replaced fixed widths and the off-grid 6px overlay offset with semantic tokens.'),
        ('ds-dont', 'A local fixed width or an unexplained colour dot', 'Do not repeat the literal dimensions harvested from ui.css. Keep status words and names visible, particularly in roster and medical information.'),
    ]) + '</div>'


def component_page(c):
    slug=c['slug'];kind=c['kind'];vs=variants(c)
    interactive=kind in ['button','link','input','checkbox','radio','menu','tabs','dialog','disclosure','navigation','form','tooltip','table']
    states=(['default','hover','focus','active','disabled'] if interactive else ['default'])+EXTRA_STATES.get(slug,[])
    overview=f'<p>{E(c["purpose"])}</p><div class="ds-example"><div class="ds-example__canvas ds-example__canvas--stack">{specimen(c)}</div></div><p>These are design specimens. Product data actions are not connected. Static overlay specimens remain in flow; their production focus, inert background and dismissal contract is documented below.</p>'
    sample_markup=specimen(c)
    parts=list(dict.fromkeys(re.findall(r'class="([^"]+)"',sample_markup)))
    part_names=list(dict.fromkeys(x for group in parts for x in group.split() if '__' in x))[:8]
    if not part_names:
        part_names=list(dict.fromkeys(x for group in parts for x in group.split() if not x.startswith('ds-')))[:4]
    anatomy='<div class="ds-anatomy"><figure class="ds-anatomy__figure">'+sample_markup+'</figure><ol class="ds-anatomy__list">'+''.join(f'<li><code>.{E(part)}</code> — {E(part.split("__",1)[-1].replace("-"," "))}; keep its source order and semantic element.</li>' for part in part_names)+'</ol></div><p>The visible name establishes identity. Values remain in reading order and wrap. Native attributes and written status convey state. Only actual controls receive focus.</p>'
    variant_html=''.join(f'<figure class="ds-example"><div class="ds-example__canvas ds-example__canvas--stack">{specimen(c,v)}</div><figcaption class="ds-example__caption">{E(v)}</figcaption></figure>' for v in vs)
    sized=slug in ['button','text-field','select','avatar','spinner','dialog','tabs','chip']
    sizes=('<p>Sizes follow the existing PromiseHub values: small 36px, medium 44px and large 52px controls. Prefer medium or large on phones; use 8px between compact adjacent actions. Avatar sizes are 32/40/56px; dialog widths cap at the documented panel tokens.</p>'+table(['Size','Live specimen'],[[size,specimen(c,size=size)] for size in ['sm','md','lg']])) if sized else '<p class="ds-na">This component has no independent size scale. Its content wraps inside the parent container and reads shared spacing and typography roles.</p>'
    matrix='<p>Focus columns force the same ring as keyboard focus. Disabled uses the native attribute where supported. Non-interactive containers do not acquire fake tab stops; their descendant controls carry interactive states.</p>'
    for theme in ['light','dark']:
        matrix+=f'<details><summary>{theme.title()} theme · complete variant × state matrix</summary><div data-theme="{theme}" class="ds-matrix" tabindex="0" role="region" aria-label="{E(c["title"])} {theme} state matrix"><table><caption>{E(c["title"])} — {theme}</caption><thead><tr><th scope="col">Variant</th>'+''.join(f'<th scope="col">{state}</th>' for state in states)+'</tr></thead><tbody>'
        for v in vs:matrix+=f'<tr><th scope="row">{v}</th>'+''.join(f'<td>{specimen(c,v,s)}</td>' for s in states)+'</tr>'
        matrix+='</tbody></table></div></details>'
    matrix+='<div class="ds-themes">'+''.join(f'<div data-theme="{theme}">{specimen(c)}</div>' for theme in ['light','dark'])+'</div>'
    responsive='<p>Below 640px, keep a single reading column, allow long names to wrap and retain 16px page margins. At 768px the grid becomes eight columns with 24px gutters and 32px margins. At 1024px use twelve columns with 32px gutters and 48px margins. At 1280px the main container caps at 80rem; 1536px adds no extra content width.</p>'
    specific={
        'bottom-navigation':'Fixed phone navigation is hidden from 768px. Toasts and bulk actions sit above its 64px height and include the device safe area.',
        'dialog':'Below 640px use the existing full-width bottom sheet. At larger widths center the panel. Long content scrolls inside the body; keep the action footer reachable.',
        'drawer':'Use the viewport height and a full-width phone panel with a reachable close button; larger sheets cap at the sidebar or sheet width token.',
        'table':'Preserve native table semantics. Horizontal scrolling belongs to .table-wrap, not to the page. Columns marked .hide-sm are hidden below 640px; only mark columns the row can be understood without. .table-wrap--fit lets headers wrap and narrows cell padding on phones so a small table fits without scrolling. .table-wrap--names keeps a name-first column on one line from 640px. Short first-column links, such as dates, never wrap.',
        'tabs':'From 640px keep one horizontal row that scrolls inside its own region. Below 640px tabs wrap onto a second row instead of scrolling out of sight; each tab label stays on one line. Inside a stack the tab row carries no bottom margin; the stack gap separates it from the panel.',
        'roster':'Names and flags wrap; retain the final attendance action. The action minimum is 5.5rem on phones and 6.5rem on larger screens. Below 640px a medical flag keeps its icon and colour and moves its word into the accessible name. In a flush card the status stripe follows the card radius on the first and last rows. Summary cards change from two to four columns at 768px.',
        'quick-card':'Below 640px each facts label sits above its value. Emergency copy stays large; contact buttons occupy their own full row until 640px.',
        'toast':'Use the full available phone width above the bottom navigation. At 640px and wider cap the region to the notification width token.',
        'guardian-shell':'Keep a single column capped at 36rem. Keep the language label visible; long translated labels wrap instead of clipping.',
        'wizard':'On phones the primary footer action occupies a full row, followed by Back and Skip. When a step has no Back button, Skip sits at the end of the row like every other step. From 640px related short fields can share a row; the wizard caps at 60rem.',
        'list':'Below 640px a trailing badge drops under the item text, aligned with the text rather than the avatar, instead of squeezing it. Inside a padded card list items line up with the card text.',
        'badge':'Below 640px a badge that trails list text wraps under that text instead of squeezing it. Badge text itself never wraps.',
        'stat':'In a KPI row, two columns on phones and four from 768px, each label grows to fill its space so the numbers share one baseline even when one label wraps.',
        'timeline':'Inside a flush card each entry keeps the card inset; inside a padded card it uses the card padding.',
        'card':'A flush card title uses the same top inset as a padded card so headings align across a row. Cards in a page stack are one layout gutter apart: 16px, 24px and 32px.',
        'medical-flag':'Below 640px the flag keeps its icon and colour and moves its word into the accessible name, so roster rows stay one line; the Quick Card always shows the word.',
        'alert':'A ghost button that starts the alert action row lines its label up with the alert text above.',
        'top-bar':'Navigation links appear from 768px; Programs, Messages and Reports wait until 1024px. Search waits until 1280px. Incidents and Settings remain in More. With an org switcher the brand name steps aside and the switcher sits one half-step closer to the brand; its organization name shows from 1024px.',
    }.get(slug,'Controls wrap inside their available width. Hover is an enhancement; labels and recovery actions remain available to touch and keyboard users. No essential content is hidden at a breakpoint.')
    responsive+=f'<p>{specific}</p>'
    token_names=['--color-fg-default','--color-bg-surface','--color-focus-ring','--target-comfortable','--layout-gutter']
    if slug in ['button','badge','chip','tabs']:token_names+=['--color-accent','--color-fg-on-accent','--color-accent-subtle']
    if slug in ['medical-flag','quick-card','alert','sync-status']:token_names+=['--color-danger-bg','--color-danger-fg','--color-warning-bg','--color-warning-fg']
    selector_classes=re.findall(r'\.([\w-]+)',c['selector'].split(':')[0])
    for selector,block in re.findall(r'([^{}]+)\{([^{}]*)\}',CSS):
        if any(re.search(r'\.'+re.escape(cls)+r'(?:__|--|\b)',selector) for cls in selector_classes):
            token_names.extend(n for n in re.findall(r'var\((--[\w-]+)',block) if n in TOKEN_NAMES)
    token_names=list(dict.fromkeys(token_names))
    pattern={'button':'button','menu':'menu-button','tabs':'tabs','dialog':'dialog-modal','disclosure':'accordion','radio':'radio','checkbox':'checkbox','tooltip':'tooltip','table':'table','input':'landmarks','navigation':'landmarks','form':'landmarks','display':'landmarks','feedback':'alert','progress':'meter','link':'link'}.get(kind,'landmarks')
    access=f'<h3>Role and pattern</h3><p>Follow the <a href="https://www.w3.org/WAI/ARIA/apg/patterns/{pattern}/">WAI-ARIA APG {pattern} pattern</a> where applicable. Use native HTML first; descriptive containers have no added widget role. Static dialog specimens are labelled groups rather than active modals.</p><h3>Keyboard map</h3>'+table(['Key','Result'],KEYBOARD[kind])
    access+='<h3>Focus and labels</h3><p>DOM order matches reading order. Use the shared focus ring and offset; do not cover it with sticky actions. The visible name supplies the accessible name. Link help and errors through aria-describedby. Dialogs move focus to the heading or first useful control, trap it while open, then return it to the opener. Background content becomes inert. Routine status updates never steal focus.</p><h3>Contrast</h3><div class="ds-themes">'+''.join(f'<div data-theme="{theme}"><div class="ds-pair">Text on surface <span data-contrast="--color-fg-default|--color-bg-surface" data-min="4.5"></span></div><div class="ds-pair">Focus on surface <span data-contrast="--color-focus-ring|--color-bg-surface" data-min="3"></span></div></div>' for theme in ['light','dark'])+'</div><h3>Motion and touch</h3><p>Transitions read duration and easing tokens. Reduced motion minimizes transitions and stops decorative loops. Targets are at least 24px; routine phone controls are 44px or larger. Allow 8px separation for compact actions. Hover-only instructions must also appear on focus; neither hover nor dragging is required to complete a task.</p>'
    content='<p>Use sentence case, specific verbs and real object names: “Check in Mateo”, “Send permission slip”, “Save guardian”. Preserve accents in names such as Sofía. Say why an action failed and how to fix it; retain entered values. Never expose private medical details in a general message or notification preview. Status, dates and counts are written in text, not only colour or iconography.</p>'
    sources=source_list(c)+'<p>Extraction drift: PromiseHub additions now share assets/components.css; fixed component dimensions became semantic tokens. The 6px overlay offset was snapped to the existing 8px spacing step. Existing token names, colour values, URLs and class names were preserved. Core additions are explicitly identified above.</p>'
    body=''.join([section('overview',overview),section('anatomy',anatomy),section('variants',variant_html),section('sizes',sizes,na=None if sized else 'Content-sized component with no independent size scale.'),section('states',matrix),section('responsive',responsive),section('theming','<p>Read semantic roles rather than palette values. Light and dark specimens share markup. A nested theme scope recomputes foregrounds and surfaces; status colours retain their named meanings. Keep organization accent foreground and background as one validated pair.</p>'),section('accessibility',access),section('content',content),section('do-dont',do_dont(c)),section('tokens',token_table(token_names)),section('code','<pre><code>'+E(specimen(c))+'</code></pre><p>Copy the semantic markup and shared classes. In Angular, implement this design once in the components library; feature pages compose that implementation.</p>'),section('sources',sources)])
    write(f'components/{slug}.html',page(f'components/{slug}.html',c['title'],c['purpose'],body,'Component'))


FOUNDATION_COPY = {
 'color': ('Colour', 'Violet identifies primary actions; semantic status colours always carry written meaning.', '<p>Preserve the inherited violet ramp and both theme palettes. Default, muted and subtle text are separate roles; disabled text and decorative dividers are not evidence of readable text contrast. Medical flags pair danger text with a tinted surface. All declared pairs below are checked in both themes.</p>'),
 'typography': ('Typography', 'Rounded system type keeps names, instructions and high-priority information legible.', '<p>Body copy is 16px with 1.5 line height. Captions never fall below 12px. Use 30px section titles and 36px page titles sparingly on phones. Quick Cards use 18px emergency information. Preserve names and accents; tabular numbers align attendance counts. Prose caps at 65ch.</p>'),
 'spacing': ('Spacing', 'A 4px base scale sets consistent inside and between spacing.', '<p>Use 4–8px between icon and text, 12–16px inside compact groups and 24px inside large cards. Page sections use the current layout gutter: 16px on phones, 24px on tablets and 32px on laptops. The 2px half-step remains only for hairline relationships. The extracted 6px overlay offset was corrected to 8px.</p>'),
 'layout': ('Layout', 'One mobile-first grid governs columns, margins, gutters and page widths.', '<p>Margin is viewport-to-content space; gutter is column-to-column space. The content container caps at 80rem. Staff pages compose header, filters, counts, records and pagination one gutter apart. Guardian reading flows cap at 36rem; setup flows cap at 60rem.</p>'),
 'elevation': ('Elevation', 'Four shadow levels and explicit layers distinguish surfaces without competing with content.', '<p>Cards use shadow 1; dropdowns use 2; menus and popovers use 3; dialogs use 4. In dark mode the canvas is darker than the surface, which is darker than the raised surface. Layers progress from base to sticky, dropdown, overlay, modal, popover, toast and tooltip. Never introduce local z-index numbers.</p>'),
 'shape': ('Shape', 'Five ordinary radii and one full pill radius establish a consistent rounded language.', '<p>Use extra-small for tiny indicators, small for compact labels, medium for controls, large for cards and dialogs, and extra-large for sheets. Full radius is reserved for circles and pills. Hairline borders separate content; thick borders emphasize controls and emergency notices.</p>'),
 'motion': ('Motion', 'Movement explains change and remains optional.', '<p>Use 120ms for hover, 200ms for reveals, 320ms for sheets and 500ms only for deliberate completion. Tooltips wait 300ms before showing and close immediately. Reduced-motion tokens reduce transitions to near-zero; decorative loops stop. Never flash or animate critical medical information.</p><div class="ds-motion-demo" data-run="false"><button class="btn" type="button" data-motion-run>Replay reveal</button><span class="dot" aria-hidden="true"></span></div>'),
 'iconography': ('Iconography', 'Outline icons support written labels; colour alone never identifies a medical or attendance state.', '<p>Use the existing 24-unit view box, currentColor stroke and 16/20/24px semantic sizes. Decorative SVGs set aria-hidden. Icon-only actions require an explicit verb and object name and a focus-accessible tooltip. Do not use an icon as the only allergy or pickup instruction.</p>'),
 'theming': ('Theming', 'Change semantic roles once to update every component and mock.', '<p>Light is the root default. Dark follows the operating-system preference unless data-theme forces light or dark. The explicit dark block and OS dark block use the same values. Native controls follow color-scheme. Forced-colours defers borders and focus to system colours; increased contrast strengthens muted text and dividers.</p><p>The DTCG <a href="../tokens/tokens.json">tokens.json export</a> is generated from tokens.css. Add a theme by overriding semantic roles, then run every contrast pair before publishing. Side-by-side examples explicitly scope both themes.</p>'),
 'responsive': ('Responsive', 'Let content wrap and controls stay reachable from a 360px phone to an office laptop.', '<p>At 640px related short fields can share a row and sheets can center. At 768px primary top-bar navigation replaces the phone tab bar. At 1024px secondary staff navigation appears. Search waits until 1280px; content does not widen beyond 80rem. Long names and Spanish copy wrap. Tables scroll inside named regions. Dialog footers stay reachable and fixed navigation includes safe-area padding.</p><p>Test 200% text zoom and a 320 CSS-pixel effective viewport. Never hide required labels or medical details to make a layout fit.</p>'),
 'accessibility': ('Accessibility', 'WCAG 2.2 AA is a component contract and a screen-level responsibility.', '<p>Use native controls, visible labels, logical headings, landmarks and a first-focus skip link. Normal text needs 4.5:1; large text and meaningful graphic edges need 3:1. The 2px focus ring must remain visible and unobscured. Keyboard and touch can complete the same tasks; do not require dragging. Respect reduced motion and forced colours. Language is declared on the document and changed phrases.</p><p>Group choices with fieldset and legend. Identify errors in text and suggest a correction. Focus a linked error summary after failed submission; do not erase input. Important errors persist. Modal focus is contained and restored. Do not block paste, password managers or accessible authentication. Reuse previously entered data, keep Help in the same place, and require review for financial or destructive actions.</p><p>Static checks validate structure and declared contrast; they do not certify screen-reader behavior. Future Angular components and screens need keyboard, screen-reader and axe checks, including status announcements and focus restoration.</p>'),
 'content': ('Content', 'Speak calmly and directly to staff and families, in their language.', '<p>Use sentence case and specific verbs. Say “Send permission slip”, not “Submit”; “Add a child”, not “Create entity”. An error states what happened and how to recover. An empty state names what is missing and offers one action. Avoid blame and jargon. Keep medical details out of shared previews.</p>'),
}


def token_foundation(name):
    if name.startswith(('--palette-','--color-')): return 'color'
    if name.startswith(('--font-','--line-height-','--letter-spacing-','--text-')): return 'typography'
    if name.startswith('--space-'): return 'spacing'
    if name.startswith(('--shadow-','--z-')): return 'elevation'
    if name.startswith(('--radius-','--border-width-')): return 'shape'
    if name.startswith(('--duration-','--ease-')): return 'motion'
    if name.startswith('--size-icon-'): return 'iconography'
    if name.startswith(('--target-','--focus-','--control-')): return 'accessibility'
    return 'layout'


def foundation_page(name):
    title,lead,copy_text=FOUNDATION_COPY[name]
    content=section('principles',copy_text)
    names=[x for x in TOKEN_NAMES if token_foundation(x)==name]
    if name=='color':
        ramps={}
        for n in names:
            if n.startswith('--palette-'):
                group=re.sub(r'-\d+$','',n)
                ramps.setdefault(group,[]).append(n)
        content+=section('ramps',''.join('<h3>'+E(group.replace('--palette-','').title())+'</h3><div class="ds-swatches">'+''.join(f'<div class="ds-swatch"><div class="ds-swatch__chip" style="--swatch:var({n})"></div><div class="ds-swatch__body"><code>{n}</code></div></div>' for n in ns)+'</div>' for group,ns in ramps.items()))
        content+=section('contrast','<p>Every declared foreground/background pair; body text minimum 4.5:1, meaningful controls and marks 3:1. Ratios update live in both scoped themes.</p>'+''.join('<h3>'+E(p.get('note','Token pair'))+'</h3><div class="ds-themes">'+''.join(f'<div data-theme="{theme}"><div class="ds-pair"><span><code>{p["fg"]}</code> on <code>{p["bg"]}</code></span><span class="ds-pair__ratio" data-contrast="{p["fg"]}|{p["bg"]}" data-min="{p.get("min",4.5)}"></span></div></div>' for theme in ['light','dark'])+'</div>' for p in PAIRS))
    if name=='typography':content+=section('specimens',''.join(f'<div class="ds-specimen"><code>{n}</code><p style="font:var({n})">Keep every promise to families.</p></div>' for n in names if n.startswith('--text-')))
    if name=='spacing':content+=section('scale','<div class="ds-scale">'+''.join(f'<div class="ds-scale__row"><code>{n}</code><span>4px base</span><span class="ds-scale__bar" style="--size:var({n})"></span></div>' for n in names)+'</div>')
    if name in ['layout','responsive']:
        content+=section('breakpoints',table(['Minimum width','Columns','Gutter','Margin','Behavior'],[['0 / 640px','4','16px','16px','Phone; 640px allows related fields'],['768px','8','24px','32px','Top-bar navigation'],['1024px','12','32px','48px','More staff sections'],['1280px','12','32px','48px','Search; 80rem cap'],['1536px','12','32px','auto','Cap content; preserve measure']])+'<div class="ds-grid-demo">'+''.join(f'<span>{i}</span>' for i in range(1,13))+'</div>')
    if name=='elevation':content+=section('surfaces','<div class="ds-themes">'+''.join(f'<div data-theme="{theme}"><div class="ds-shadow-grid">'+''.join(f'<div style="--shadow:var(--shadow-{i})">Level {i}</div>' for i in range(1,5))+'</div></div>' for theme in ['light','dark'])+'</div>')
    if name=='shape':content+=section('radii','<div class="ds-shadow-grid">'+''.join(f'<div style="border-radius:var({n})">{n}</div>' for n in names if n.startswith('--radius-'))+'</div>')
    if name=='iconography':content+=section('specimens','<div class="cluster">'+''.join(f'<svg class="icon" style="width:var(--size-icon-{size});height:var(--size-icon-{size})" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>' for size in ['sm','md','lg'])+'<span>Add child</span></div>')
    if name=='content':content+=section('microcopy',table(['Situation','Recommended copy','Rule'],[['Success','Mateo is checked in.','Name the completed action.'],['Error','We could not send the slip. Check your connection and try again.','Cause plus recovery; no blame.'],['No results','No households match “Rivera”. Clear the filters to see everyone.','Echo the search and explain recovery.'],['First run','No children enrolled yet. Add a child to get started.','One next action.'],['Pending sync','Check-in saved on this device. Waiting to sync.','Do not claim a server save.'],['Count','3 of 24 children checked in','Keep denominator and subject.'],['Date','Thursday 5 November, 3:30 pm','Spell the month; honor locale and timezone.'],['Confirmation','Send this permission slip to 24 guardians?','Review audience and consequence.']]))
    if names:content+=section('tokens','<p>Each token is assigned to exactly one foundation page. Values below resolve independently in light and dark scopes.</p>'+token_table(names))
    content+=section('sources','<p>Extracted from <a href="../../mocks/index.html">the PromiseHub mocks</a>, the original shared token file and the promoted component stylesheet. See the <a href="../README.md">drift and verification record</a>.</p>')
    write(f'foundations/{name}.html',page(f'foundations/{name}.html',title,lead,content,'Foundation'))


def pattern_page(slug, data):
    title,lead,parts=data
    components=[next(c for c in COMPONENTS if c['slug']==x) for x in parts]
    example='<div class="ds-example"><div class="ds-example__canvas ds-example__canvas--stack">'+''.join(specimen(c) for c in components)+'</div></div>'
    specifics={
        'forms':'Validate on blur, then revalidate that field on input. After failed submit focus a linked summary; keep all values. During submit mark the action busy and prevent duplicates. Confirm destructive consequences before commit; autosave announces Saved without stealing focus.',
        'feedback-loading':'Acknowledge the pressed action immediately. Use skeletons when content shape is known, a spinner for a short bounded wait and progress only when a real denominator is available. Do not show invented percentages. Optimistic actions need Undo or an explicit pending state.',
        'empty-error-states':'Distinguish no records, no matching results, insufficient permission and a failed request. Do not use an empty state to hide an error. A 500 state includes a support reference without leaking personal information; offline copy distinguishes cached information from fresh data.',
        'navigation':'The shell owns top-level destinations. Features own their page headings, parent breadcrumbs and local tabs. Back returns to the calling context and preserves filters. Guardian pages use a single column and labelled language selection. Access remains server-enforced even when links are hidden.',
        'dialogs-overlays':'Use a page for long reading or several decisions. Use a modal for a short focused edit or confirmation, a drawer for navigation and a popover for short contextual content. Do not stack competing modals. Restore focus to the opener; use Angular CDK Dialog/Overlay in the application.',
        'data-tables-lists':'Filter before pagination. Preserve sort and selected rows as the user moves through results; state the scope of Select all. Announce changed counts politely. Bulk actions name the affected count. Use explicit load-more or numbered pages for bounded records; do not introduce endless scroll into attendance tasks.',
        'notifications':'Toasts acknowledge low-priority completed actions. Errors and work requiring review remain visible in a banner or notification center. Group by event or task; keep unread state textual. Pause any auto-dismiss timer on hover and focus. Never auto-dismiss an actionable error or expose medical details in SMS or push previews.',
        'content-tone':'State the outcome first, then the next action. Keep verbs consistent across staff and guardian pages. Translate complete messages with locale-aware dates and counts; never concatenate fragments. Preserve accents and allow at least 30% text expansion. Use Help consistently and explain errors without blame.',
    }[slug]
    body=section('overview','<p>'+lead+'</p>'+example)
    body+=section('when','<p>'+specifics+'</p>')
    body+=section('structure','<ol>'+''.join(f'<li><a href="../components/{c["slug"]}.html">{c["title"]}</a> — {c["purpose"]}</li>' for c in components)+'</ol>')
    body+=section('states',table(['State','Behavior'],[['Default','Show current context and one primary next action.'],['Loading / submitting','Keep layout stable, name the ongoing work and prevent duplicate submission.'],['Success','Describe what changed and retain the path back.'],['Empty / no results','Explain the distinction and offer a relevant next action.'],['Error / invalid','Retain context and values, describe correction or retry.'],['Offline / forbidden','State the limitation explicitly; do not imply an action was persisted or authorized.']]))
    body+=section('responsive','<p>One column and 16px margins on phones; related fields and panels may share columns from 768px. Use 24px tablet and 32px desktop gutters. Actions wrap without losing reading order. A table scrolls in its own region and long translated text remains visible. Sheets use available device height and preserve safe-area padding.</p>')
    body+=section('accessibility','<p>Retain heading and landmark order, visible labels and focus. Announce routine updates politely and urgent new errors assertively. Move focus only for navigation, modal entry or a failed-submit error summary. Never require a pointer, hover, colour recognition or dragging. Support reduced motion, zoom and forced colours. See <a href="../foundations/accessibility.html">the accessibility contract</a>.</p>')
    body+=section('content','<p>'+specifics+'</p><p>Use concrete family-facing language, sentence case and locale-aware dates. Do not put private information into a broadly visible preview.</p>')
    body+=section('do-dont',do_dont(components[0]))
    body+=section('sources',''.join(source_list(c) for c in components)+'<p>Promoted styles and dimension normalization are recorded in the catalogue README. These compositions document design behavior and do not implement application workflows.</p>')
    write(f'patterns/{slug}.html',page(f'patterns/{slug}.html',title,lead,body,'Pattern'))


def index_and_readme():
    groups=[('Foundations',[(f'foundations/{n}.html',FOUNDATION_COPY[n][0],FOUNDATION_COPY[n][1]) for n in FOUNDATIONS]),('Components',[(f'components/{c["slug"]}.html',c['title'],c['purpose']) for c in COMPONENTS]),('Patterns',[(f'patterns/{n}.html',v[0],v[1]) for n,v in PATTERNS.items()])]
    body=section('start',f'<p>This is the design reference extracted from {SCREEN_COUNT} screens and {len(files)} HTML mocks. Start with foundations, inspect a component’s states and accessibility contract, then use patterns to compose a screen. Copy semantic classes and the DTCG token export into the shared Angular components library as implementation proceeds. The application remains a scaffold.</p><div class="ds-example"><div class="ds-example__canvas"><button class="btn btn--primary" type="button">Check in Mateo</button><span class="badge badge--success">Signed</span><span class="flag">Allergy information</span><span class="sync-chip">Waiting to sync</span></div></div><p><a href="tokens/tokens.json">DTCG tokens</a> · <a href="tokens/contrast-pairs.json">Contrast pair inventory</a> · <a href="README.md">Drift and verification record</a></p>')
    md=['# PromiseHub design system','', 'Extracted from the PromiseHub HTML mocks on 2026-10-25. This is a complete design catalogue, not Angular component implementation. The application remains a scaffold. Existing token names and mock URLs are preserved.', '', 'Open [index.html](index.html) to browse the system. Every component documents anatomy, variants, sizes, state matrices, responsive rules, themes, accessibility, content, do/don’t, tokens, copyable markup and sources.', '', '## Token and style sources', '', '- [tokens/tokens.css](tokens/tokens.css): source of truth, inherited violet brand, semantic roles and both themes.', '- [tokens/tokens.json](tokens/tokens.json): generated DTCG export.', '- [tokens/contrast-pairs.json](tokens/contrast-pairs.json): inherited and PromiseHub-specific pairs.', '- [assets/components.css](assets/components.css): inherited kit plus promoted PromiseHub components; names remain stable.', '- [tools/build.py](tools/build.py) and [tools/catalog.py](tools/catalog.py): repeatable catalogue generation from the mocks. Requires Python and `beautifulsoup4`.', '', '## Update and regeneration', '', 'Edit tokens and shared component CSS first. Edit catalogue metadata and generator prose for documentation changes. Run `python docs/design-system/tools/build.py` from the repository root, then the skill’s token export, structure and contrast checkers. The mock generator already points to this token and component CSS. `docs/mocks/assets/ui.css` remains an empty compatibility file; add shared styles here.', '']
    for title,links in groups:
        body+=section(title.lower(),'<div class="ds-cards">'+''.join(f'<a class="ds-card" href="{p}"><b>{E(label)}</b><span>{E(desc)}</span></a>' for p,label,desc in links)+'</div>')
        md+=['## '+title,'','| Page | Purpose |','|---|---|']+[f'| [{label}]({p}) | {desc} |' for p,label,desc in links]+['']
    md+=['## Changelog and drift', '', '| Evidence | Issue | Resolution |', '|---|---|---|', '| Existing design system | Five vendored files but no browsable catalogue | Added twelve foundations, all evidenced and core components, and eight patterns. Preserved original token names and stylesheet classes. |', '| mocks/assets/ui.css | PromiseHub components lived outside the shared catalogue | Promoted all styles to assets/components.css; retained an empty compatibility file and the original mock URLs. |', '| ui.css and inherited components.css | Fixed widths, label measures and blur lengths lived directly in rules | Added semantic dimension tokens with the same values; reused existing space and control tokens where values matched. Media query thresholds remain literal because CSS custom properties cannot be used there. |', '| ui.css overlay offset | 0.375rem (6px) was off the 4px spacing grid | Normalized to --space-2 (8px). An inherited, unused achievement-badge overhang was also snapped from 3.2px to the 4px step; no PromiseHub mock uses that selector. |', '| Existing tokens.css | Copied organization comment referenced a different product’s ADR and implied an implemented server feature | Replaced the comment with the scoped pair contract; no existing token value changed. Organization branding remains unimplemented. |', '| Quick Card phone facts | The .quick-card-specific two-column rule overrode the narrower generic phone rule | Matched specificity in the phone rule so labels stack above values below 640px, as documented; no information is removed. |', '| Core catalogue | Tooltip, spinner and complete sidebar/pagination specimens were not all present in mocks | Documented core compositions using inherited roles and tokens; source sections identify core additions explicitly. |', '| mocks/assets/ui.css review fixes | Table hide-sm and first-column links, phone tab wrapping, padded-card lists, roster stripe radius, KPI label baseline, phone chart labels, alert ghost action, wizard Skip, flush card titles, name-first tables and flush-card feeds lived only in the mock stylesheet | Promoted to assets/components.css in the same cascade position; raw widths reuse existing layout tokens with identical values. Tabs, table, list, badge, stat, timeline, card, medical flag, alert, roster, wizard and top bar pages now document these behaviours; the tabs page previously said tabs never wrap, which the mocks contradict. |', '| Inherited component CSS | Includes historical selectors unused by PromiseHub | Retained for compatibility; catalogue scope is the PromiseHub evidence plus the core set. Do not interpret unused inherited selectors as implemented product features. |', '', '## Verification', '', 'See [verification.md](verification.md) for actual checker results, reviewed screenshots and limitations. The structure and contrast checks do not substitute for application-level keyboard, screen-reader and axe checks.', '', '## Remaining design decisions', '', 'The violet brand remains the existing mock default pending a PromiseHub brand decision. Typed-signature legal requirements remain a product decision; this catalogue documents visual evidence only. No application consent or messaging logic is implemented.']
    write('index.html',page('index.html','PromiseHub design system','The visual and interaction language for staff, guardians and youth-serving organizations.',body,'Catalogue'))
    write('README.md','\n'.join(md))


if __name__=='__main__':
    for name in FOUNDATIONS: foundation_page(name)
    for c in COMPONENTS: component_page(c)
    for slug,data in PATTERNS.items(): pattern_page(slug,data)
    index_and_readme()
    print(f'Generated {len(FOUNDATIONS)} foundations, {len(COMPONENTS)} components, {len(PATTERNS)} patterns.')
