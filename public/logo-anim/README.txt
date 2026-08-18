Parousia Baptist Ministries layered SVG assets

Shared viewBox:
0 0 520 200

Layer order:
1. swoop.svg
2. cross.svg
3. wordmark.svg
4. dove.svg

Sampled colors:
Blue:  #03259A
Gold:  #D4A504
Black: #111827

Alignment:
All files already use final assembled coordinates. Stack them at identical width/height
with position:absolute; inset:0. No per-layer offset is required.

Typography:
The wordmark uses Arial/Helvetica fallbacks. For pixel-perfect branding across systems,
convert the text to outlined paths later using your preferred design tool or load a chosen
web font in the page.

Suggested HTML:
<div class="logo">
  <img src="/logo/swoop.svg" class="layer swoop" alt="">
  <img src="/logo/cross.svg" class="layer cross" alt="">
  <img src="/logo/wordmark.svg" class="layer wordmark" alt="Église Baptiste Parousie">
  <img src="/logo/dove.svg" class="layer dove" alt="">
</div>

Suggested CSS:
.logo {
  position: relative;
  width: min(100%, 900px);
  aspect-ratio: 520 / 200;
}
.logo .layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
