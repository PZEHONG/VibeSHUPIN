import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill, renderMedia} from '@remotion/renderer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const request = JSON.parse(readFileSync(process.argv[2], 'utf8'));
let browser;
try {
  console.log('准备 Remotion 画面…');
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'),
    publicDir: path.join(root, 'public'), outDir: request.bundleDir});
  browser = await openBrowser('chrome', {browserExecutable: request.browserExecutable});
  const inputProps = {...request.props, audit: false};
  const composition = await selectComposition({serveUrl, id: 'BookReview', inputProps,
    puppeteerInstance: browser});
  const geometry = [];
  const onBrowserLog = log => {
    if (log.text.startsWith('[vibe-geometry]')) {
      geometry.push(JSON.parse(log.text.slice('[vibe-geometry]'.length)));
    } else if (log.type === 'error') console.error(log.text);
  };
  const audited = {...composition, props: {...composition.props, audit: true}};
  for (const item of request.auditStills) {
    await renderStill({serveUrl, composition: audited, inputProps: {...inputProps, audit: true},
      frame: item.frame, output: item.output, imageFormat: 'png', puppeteerInstance: browser, onBrowserLog});
  }
  if (request.mode === 'stills') {
    for (const item of request.stills) {
      await renderStill({serveUrl, composition: audited, inputProps: {...inputProps, audit: true},
        frame: item.frame, output: item.output, imageFormat: 'png', puppeteerInstance: browser,
        onBrowserLog});
      console.log(`静帧 ${item.frame} → ${item.output}`);
    }
  } else {
    mkdirSync(path.dirname(request.output), {recursive: true});
    let last = -1;
    await renderMedia({serveUrl, composition, inputProps, puppeteerInstance: browser,
      codec: 'h264', crf: 18, pixelFormat: 'yuv420p', muted: true, concurrency: request.concurrency,
      outputLocation: request.output, frameRange: [request.from, request.to - 1],
      onProgress: ({renderedFrames, progress}) => {
        const percent = Math.floor(progress * 10) * 10;
        if (percent !== last) {last = percent; console.log(`渲染 ${percent}% (${renderedFrames} 帧)`);}
      }});
    console.log(`无声画面：${request.output}`);
  }
  writeFileSync(request.geometryOutput, JSON.stringify(geometry, null, 2));
} catch (error) {
  console.error(error.stack || error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close({silent: true});
}
