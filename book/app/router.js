export function createRouter(onChange) {
  function chapterPath(id) {
    return `/chapter/${id}`;
  }

  function parse(locationLike = window.location) {
    const match = locationLike.pathname.match(/^\/chapter\/(\d{2})\/?$/);

    if (match) {
      return { name: "chapter", chapterId: match[1] };
    }

    return { name: "contents" };
  }

  function notify() {
    onChange(parse());
  }

  function navigate(path) {
    if (window.location.pathname === path) {
      notify();
      return;
    }

    window.history.pushState({}, "", path);
    notify();
  }

  function mount() {
    window.addEventListener("popstate", notify);
    notify();
  }

  function destroy() {
    window.removeEventListener("popstate", notify);
  }

  return {
    chapterPath,
    current: () => parse(),
    destroy,
    mount,
    openChapter: (id) => navigate(chapterPath(id)),
    openContents: () => navigate("/"),
  };
}
