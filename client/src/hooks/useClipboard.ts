import { useState, useEffect } from 'react';

export function useClipboard(timeout = 2000) {
  const [clipboardAvailable, setClipboardAvailable] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setClipboardAvailable(
      navigator.clipboard && typeof navigator.clipboard.readText === 'function'
    );
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  };

  const pasteFromClipboard = async () => {
    if (!clipboardAvailable) return null;
    try {
      return await navigator.clipboard.readText();
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      return null;
    }
  };

  return {
    clipboardAvailable,
    copied,
    copyToClipboard,
    pasteFromClipboard
  };
}
