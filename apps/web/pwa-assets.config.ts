import {
  combinePresetAndAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: combinePresetAndAppleSplashScreens(minimal2023Preset, {
    padding: 0.3,
    resizeOptions: { background: '#FFF3E7' },
  }),
  images: ['pwa-assets/source.svg'],
})
