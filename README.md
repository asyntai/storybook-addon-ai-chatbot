# storybook-addon-ai-chatbot

Add the [Asyntai](https://asyntai.com) AI chat assistant to your Storybook. It
answers questions about your components and your design system from your own
docs, in more than 80 languages.

## Install

```bash
npm install --save-dev storybook-addon-ai-chatbot
```

Then add the addon and your widget ID in `.storybook/main.ts` (or `main.js`):

```ts
const config = {
  // ...
  addons: [
    // ...your other addons
    {
      name: 'storybook-addon-ai-chatbot',
      options: { widgetId: 'asyntai_1a2b3c4d5e6f' },
    },
  ],
};

export default config;
```

Start Storybook with `npm run storybook`, or publish it with
`npm run build-storybook`. The chat bubble is in the corner of the Storybook
window, on every story and every Docs page.

## Where the widget ID comes from

Open the Install page in your [Asyntai dashboard](https://asyntai.com/dashboard).
The widget ID is the value of `data-asyntai-id` in the snippet shown there. It
starts with `asyntai_`.

Creating an account is free, and the Free plan is enough to try the widget.

## Options

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `widgetId` | string | required | Your Asyntai widget ID |
| `scriptUrl` | string | the Asyntai CDN | Advanced. Load the widget from another URL |

A missing or malformed `widgetId` stops Storybook with a message that says how
to fix it.

## Compatibility

Storybook 8, 9 and 10, with every framework: React, Vue, Angular, Svelte, Web
Components, HTML, Preact and Ember.

## What the addon does

- It adds the Asyntai loader to the Storybook window (the manager), in
  `storybook dev` and in the static build.
- Your stories render in their own frame, as before. The widget is never added
  to them, so it does not change your components, your tests or your visual
  snapshots.
- The loader waits for the page's `load` event, so Storybook always renders
  first.
- A page that already has the Asyntai widget gets no second one.

## Answering from your documentation

Asyntai reads your published pages. Add the URL of your published Storybook or
your design system site in the dashboard, and the assistant answers from it.
You can also add guides, and question and answer pairs.

## Removing it

Delete the addon from the `addons` list and restart Storybook. The widget is
gone.

## Support

Email [hello@asyntai.com](mailto:hello@asyntai.com), or read the
[Storybook guide](https://asyntai.com/documentation/integrations/storybook/).

## Licence

MIT. See [LICENSE](LICENSE).
