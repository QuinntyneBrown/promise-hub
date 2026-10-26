# 47 · Manage organizations

PromiseHub serves many organizations from one deployment, and someone has to look after the deployment itself. This video shows the platform admin's organizations list: adding a new organization, and suspending one without losing anything.

## What platform admins can do

Only platform admins open the list; anyone else gets a forbidden page, and the server refuses them too. Each organization shows its plan, active children, how many modules are on, and a status: active, setting up, or suspended. You can search by name and filter by plan or status. Adding one needs a name, the first admin's email, a plan and a module preset. Suspending needs a reason, and it blocks staff, guardian links and outbound messages, but deletes nothing.

## Tom adds an organization

Here is Tom on a laptop, on the organizations list. He adds Kitchener Youth Alliance, gives Dana's email, and picks Just check-in. The dialog says it's ready and Dana has the welcome email, and the new row shows three modules on, setting up.

## Tom suspends one

Here Tom suspends Northgate, with an unpaid invoice as the reason. The row now says suspended. Reinstating it brings Northgate straight back.

## What a suspended organization sees

Northgate's staff who try to open PromiseHub land on sign in, which says their organization is suspended and that nothing has been deleted. A missing name or a mistyped email is named on its own field.

## How it is tested

Backend tests cover the list with every tenant's plan, children, modules and status, search and status filters, adding a tenant that invites its admin, field errors, suspension blocking staff while keeping their data, queued messages that wait instead of sending, and refusal for anyone who is not a platform admin. The browser tests follow Tom through the list, adding and suspending, plus Grace's suspended sign in and the forbidden page, with accessibility checks.

## Recap

Things to remember. Only platform admins see every organization. A new organization starts setting up, with its admin invited. Suspending stops access and messages and deletes nothing. Next, getting PromiseHub ready to run in production.
