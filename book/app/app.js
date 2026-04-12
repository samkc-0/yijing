import { listChapters, loadChapter } from "./data.js";
import { createRouter } from "./router.js";
import { renderChapterView } from "./views/chapter-view.js";
import { renderContentsView } from "./views/contents-view.js";

export function createApp(root) {
  const chapters = listChapters();
  const router = createRouter(renderRoute);
  let renderToken = 0;
  let currentDestroy = () => {};

  function normalizeView(view) {
    if (view && view.node) {
      return view;
    }

    return {
      node: view,
      destroy() {},
    };
  }

  function show(view) {
    currentDestroy();
    const normalized = normalizeView(view);
    currentDestroy = normalized.destroy;
    root.replaceChildren(normalized.node);
  }

  function renderLoading() {
    const loading = document.createElement("main");
    loading.className = "screen chapter-screen";
    loading.textContent = "Loading";
    return { node: loading, destroy() {} };
  }

  function renderError(message) {
    const error = document.createElement("main");
    error.className = "screen chapter-screen";
    error.textContent = message;
    return { node: error, destroy() {} };
  }

  async function renderRoute(route) {
    const token = renderToken + 1;
    renderToken = token;

    if (route.name === "contents") {
      document.title = "Yijing";
      show(
        renderContentsView({
          chapters,
          onSelect: (chapterId) => router.openChapter(chapterId),
        }),
      );
      return;
    }

    show(renderLoading());

    try {
      const chapter = await loadChapter(route.chapterId);

      if (token !== renderToken) {
        return;
      }

      document.title = `${chapter.id} ${chapter.heading} | Yijing`;
      show(
        renderChapterView({
          chapter,
          onDismiss: () => router.openContents(),
        }),
      );
    } catch (error) {
      if (token !== renderToken) {
        return;
      }

      document.title = "Yijing";
      show(renderError(error.message));
    }
  }

  return {
    mount() {
      router.mount();
    },
  };
}
