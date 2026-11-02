import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {compile, getMinimizers} from '@docusaurus/bundler';
import pwaPlugin from '@docusaurus/plugin-pwa/lib/index';
import type {PluginOptions} from '@docusaurus/plugin-pwa';
import type {LoadContext, Plugin} from '@docusaurus/types';
import {injectManifest} from 'workbox-build';

export {validateOptions} from '@docusaurus/plugin-pwa/lib/index';

export default function progressPwaPlugin(context: LoadContext, options: PluginOptions): Plugin<void> | null {
  const pwaDir = path.dirname(require.resolve('@docusaurus/plugin-pwa/lib/index'));
  const plugin = pwaPlugin(context, {
    ...options,
    swRegister: options.swRegister && options.swRegister.startsWith('.')
      ? path.resolve(pwaDir, options.swRegister) : options.swRegister,
  });
  if (!plugin) return null;

  return {
    ...plugin,
    getThemePath: () => path.join(pwaDir, 'theme'),
    getTypeScriptThemePath: () => path.join(pwaDir, '../src/theme'),
    async postBuild(props) {
      const {outDir, currentBundler} = props;
      const git = (...args: string[]) => execFileSync('git', args, {cwd: context.siteDir}).toString().trim();
      await writeFile(path.join(outDir, 'deployment.json'), JSON.stringify({
        commit: process.env.GITHUB_SHA ?? git('rev-parse', 'HEAD'),
        date: git('log', '-1', '--format=%cs', 'HEAD'),
      }));

      await compile({
        currentBundler,
        configs: [{
          entry: require.resolve('./src/pwa/service-worker.js'),
          target: 'webworker',
          mode: options.debug ? 'development' : 'production',
          output: {path: outDir, filename: 'sw.js', publicPath: context.baseUrl},
          optimization: {
            splitChunks: false,
            minimize: !options.debug,
            minimizer: await getMinimizers({faster: props.siteConfig.future.faster, currentBundler}),
          },
        }],
      });

      const {warnings} = await injectManifest({
        ...options.injectManifestConfig,
        swSrc: path.join(outDir, 'sw.js'),
        swDest: path.join(outDir, 'sw.js'),
        globDirectory: outDir,
        globPatterns: ['**/*.{js,json,css,html,png,jpg,jpeg,gif,svg,ico,woff,woff2,eot,ttf,otf}'],
        globIgnores: ['deployment.json'],
        manifestTransforms: [
          ...(options.injectManifestConfig.manifestTransforms ?? []),
          async (entries) => ({
            manifest: entries.map(entry => ({...entry, byteLength: entry.size})),
            warnings: [],
          }),
        ],
      });
      for (const warning of warnings) console.warn(`[PWA] ${warning}`);
    },
  };
}
