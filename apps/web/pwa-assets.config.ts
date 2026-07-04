import {
  combinePresetAndAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

// The source artwork is already tightly cropped (~6% margin), so the
// transparent/apple-touch icons need no extra padding — adding it back here
// is what previously made the installed PWA icon look tiny with a lot of
// surrounding whitespace. Maskable icons are the exception: Android/iOS crop
// them to a circle/squircle, so their content has to stay inside a safe
// zone — hence padding only on that variant.
export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...combinePresetAndAppleSplashScreens(minimal2023Preset, {
      padding: 0.3,
      resizeOptions: { background: '#FFF3E7' },
    }),
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.2,
      resizeOptions: { background: '#FFF3E7' },
    },
  },
  images: ['pwa-assets/source.png'],
})
