export const safeRouterPush = (router, path) => {
  if (router.currentRoute.path !== path) {
    return router.push(path).catch(err => {
      if (err.name !== 'NavigationDuplicated') {
        throw err;
      }
    });
  }
  return Promise.resolve();
};

export const safeRouterReplace = (router, path) => {
  if (router.currentRoute.path !== path) {
    return router.replace(path).catch(err => {
      if (err.name !== 'NavigationDuplicated') {
        throw err;
      }
    });
  }
  return Promise.resolve();
};