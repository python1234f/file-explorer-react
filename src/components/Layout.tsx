import { NavLink, useNavigate } from 'react-router-dom';
import { useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { parseTreeJson } from '../lib/buildTreeIndex';

export function Layout({ children, importTree }: { children: ReactNode; importTree: (input: unknown) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      if (!file.name.toLowerCase().endsWith('.json')) throw new Error('Choose a .json file.');
      importTree(parseTreeJson(await file.text()));
      navigate('/tree');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not import the file.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="app-header">
      <NavLink to="/" className="brand" aria-label="File Explorer home">
        <span className="brand-icon"><Icon name="folder" /></span>
        <span>File Explorer <span className="brand-divider">/</span> <span className="brand-subtitle">workspace</span></span>
      </NavLink>
      <nav aria-label="Main navigation">
        <NavLink to="/tree">Explorer</NavLink>
        <NavLink to="/" end>Paste JSON</NavLink>
      </nav>
      <input ref={fileRef} className="visually-hidden" type="file" accept=".json,application/json"
        aria-label="Upload a new JSON file" disabled={busy} onChange={event => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }} />
      <button type="button" className="button upload-button" disabled={busy} onClick={() => fileRef.current?.click()}>
        <Icon name="upload" />{busy ? 'Reading…' : 'Upload JSON'}
      </button>
    </header>
    {error && <div className="upload-error" role="alert">{error}
      <button type="button" aria-label="Dismiss upload error" onClick={() => setError(null)}>×</button></div>}
    <main id="main">{children}</main>
  </div>;
}
