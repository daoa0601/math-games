import type { Preview } from '@storybook/react-vite'
import '../src/index.css'
import '../src/i18n'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'hsl(240, 10%, 8%)' },
        { name: 'light', value: 'hsl(0, 0%, 98%)' },
      ],
    },
  },
}

export default preview
