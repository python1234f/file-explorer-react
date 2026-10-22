import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ExplorerPage } from './pages/ExplorerPage';
import { useFileTree } from './hooks/useFileTree';

export default function App() {
  const { tree, warning, importTree, revision, loading, isDemo } = useFileTree();
  return <Layout importTree={importTree}>
    {warning && <div className="storage-warning" role="alert">{warning}</div>}
    <Routes>
      <Route path="/" element={<HomePage hasTree={Boolean(tree)} importTree={importTree} />} />
      <Route path="/import" element={<Navigate to="/" replace />} />
      <Route path="/tree/*" element={tree ? <ExplorerPage key={revision} tree={tree} isDemo={isDemo} />
        : <div className="empty-page"><h1>{loading ? 'Loading demo…' : 'No tree loaded'}</h1>
          {loading && <p role="status">Loading the default JSON file.</p>}
          <Link className="button primary" to="/">Paste JSON</Link></div>} />
      <Route path="*" element={<div className="empty-page"><h1>Page not found</h1><Link to="/tree">Back to Explorer</Link></div>} />
    </Routes>
  </Layout>;
}
