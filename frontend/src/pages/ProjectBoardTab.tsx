import { useEffect, useRef } from 'react';
import { Tldraw, type Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { useThemeMode } from '../theme/ThemeContext';

export function ProjectBoardTab({ projectId, topInset = 0 }: { projectId: number; topInset?: number }) {
  const { darkMode } = useThemeMode();
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    editorRef.current?.user.updateUserPreferences({ colorScheme: darkMode ? 'dark' : 'light' });
  }, [darkMode]);

  useEffect(() => {
    const layout = editorRef.current?.getContainer().querySelector<HTMLElement>('.tlui-layout');
    if (layout) layout.style.paddingTop = `${topInset}px`;
  }, [topInset]);

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Tldraw
          persistenceKey={`vcp-board-${projectId}`}
          onMount={editor => {
            editorRef.current = editor;
            editor.user.updateUserPreferences({ colorScheme: darkMode ? 'dark' : 'light' });
            const layout = editor.getContainer().querySelector<HTMLElement>('.tlui-layout');
            if (layout) layout.style.paddingTop = `${topInset}px`;
          }}
        />
      </div>
    </div>
  );
}
