import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { parseTreeJson } from '../lib/buildTreeIndex';
import demoUrl from '../data/demo.json?url';

const example = JSON.stringify({ name: 'root', type: 'folder', children: [
  { name: 'src', type: 'folder', children: [
    { name: 'index.ts', type: 'file', size: 1024 },
    { name: 'components', type: 'folder', children: [{ name: 'Button.tsx', type: 'file', size: 512 }] },
  ] },
  { name: 'package.json', type: 'file', size: 300 },
] }, null, 2);

export function HomePage({ importTree, hasTree }: { importTree: (value: unknown) => void; hasTree: boolean }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const demoRequest = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => () => demoRequest.current?.abort(), []);

  function load(value: unknown) {
    importTree(value);
    navigate('/tree');
  }

  function runImport() {
    setError(null);
    try {
      load(parseTreeJson(text));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not import the tree.');
    }
  }

  async function loadDemoJson() {
    const controller = new AbortController();
    demoRequest.current = controller;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(demoUrl, { signal: controller.signal });
      if (!response.ok) throw new Error('Could not load the demo JSON file.');
      const input = parseTreeJson(await response.text());
      if (!controller.signal.aborted) load(input);
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : 'Could not load the demo JSON file.');
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function readFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      if (!file.name.toLowerCase().endsWith('.json')) throw new Error('Choose a .json file.');
      setText(await file.text());
      setFilename(file.name);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not read the file.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="home-page">
    <div className="home-heading">
      <h1>File Tree Explorer</h1>
      <p>Import a JSON file or paste a directory structure to explore it.</p>
    </div>
    <div className="import-layout">
      <section className="import-card" aria-labelledby="import-title">
        <div className="card-heading"><h2 id="import-title">Import JSON</h2>
          <span className="type-tag">.json</span></div>
        <form onSubmit={event => { event.preventDefault(); runImport(); }}>
          <div className="editor-label"><label htmlFor="json-input">JSON Structure</label></div>
          <textarea id="json-input" spellCheck={false} value={text} placeholder={example}
            aria-invalid={Boolean(error)} aria-describedby={error ? 'import-error' : 'json-hint'}
            onChange={event => { setText(event.target.value); setFilename(null); setError(null); }} />
          <div className="editor-bottom"><span id="json-hint">{filename ?? 'The root must be a folder with a children array.'}</span>
            <span>JSON</span></div>
          <input ref={fileRef} className="visually-hidden" type="file" accept=".json,application/json"
            aria-label="Upload JSON file" disabled={busy} onChange={event => {
              const file = event.target.files?.[0];
              if (file) void readFile(file);
              event.target.value = '';
            }} />
          {error && <div id="import-error" className="error-message" role="alert">{error}</div>}
          <div className="import-actions"><button type="button" className="button secondary" disabled={busy}
            onClick={() => fileRef.current?.click()}><Icon name="upload" />{busy ? 'Reading…' : 'Upload JSON'}</button>
            <button type="button" className="button secondary" disabled={busy} onClick={() => void loadDemoJson()}>Load Demo JSON</button>
            <button type="submit" className="button primary" disabled={!text.trim() || busy}>Open Explorer<Icon name="arrow" /></button></div>
        </form>
      </section>
      <aside className="home-aside">
        {hasTree && <Link className="resume-link" to="/tree">Back to Explorer <Icon name="arrow" /></Link>}
      </aside>
    </div>
  </div>;
}
