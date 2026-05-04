import { useState, useCallback, useRef, useEffect } from 'react';

export function useMonteCarloWorker() {
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const runSimulation = useCallback((params) => {
    if (workerRef.current) workerRef.current.terminate();

    setIsRunning(true);
    setError(null);

    const worker = new Worker(
      new URL('../workers/monteCarloWorker.js', import.meta.url)
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === 'result') {
        setResults(e.data.data);
        setIsRunning(false);
      } else if (e.data.type === 'error') {
        setError(e.data.error);
        setIsRunning(false);
      }
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = (e) => {
      setError(e.message || 'Worker error');
      setIsRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage(params);
  }, []);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsRunning(false);
    }
  }, []);

  return { results, isRunning, error, runSimulation, cancel };
}
