
export function findModuleByPath(tree, pathKeys) {
    let currentLevel = tree;
    let node = null;
    const breadcrumb = [];
    const accumulated = [];

    for (const key of pathKeys) {
        node = (currentLevel || []).find((m) => m.key === key);
        if (!node) return null;
        accumulated.push(key);
        breadcrumb.push({title: node.title, keyPath: [...accumulated]});
        currentLevel = node.children;
    }

    return {node, breadcrumb};
}