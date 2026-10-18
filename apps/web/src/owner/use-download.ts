import { useState } from 'react';

/**
 * Saves a file the server made (the PDF or Excel of a sheet or a report) the way a browser does: a link that is clicked
 * and gone. `run` asks the server; the name is what the file is called on the owner's computer. A refusal sets `failed`, so a
 * screen can say so; the next try clears it.
 */
export function useDownload() {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async (run: () => Promise<Blob>, filename: string) => {
    setPending(true);
    setFailed(false);
    try {
      const blob = await run();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return { download, pending, failed };
}
