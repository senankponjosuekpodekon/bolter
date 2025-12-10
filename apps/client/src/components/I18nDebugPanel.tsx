/**
 * I18n Debug Panel
 *
 * Composant de debugging pour visualiser l'état du système i18n
 * et les erreurs en temps réel.
 *
 * N'apparaît qu'en mode développement.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { i18nErrorManager, type I18nError } from "../utils/i18nErrorHandler";
import { i18nMonitor } from "../utils/i18nMonitor";

export function I18nDebugPanel() {
  const { i18n } = useTranslation();
  const [errors, setErrors] = useState<I18nError[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<ReturnType<
    typeof i18nMonitor.audit
  > | null>(null);

  useEffect(() => {
    // Mettre à jour les erreurs
    const updateErrors = () => {
      setErrors(i18nErrorManager.getErrors());
    };

    // S'abonner aux nouvelles erreurs
    const unsubscribe = i18nErrorManager.onError(() => {
      updateErrors();
    });

    // Mettre à jour toutes les secondes
    const interval = setInterval(updateErrors, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const runAudit = () => {
    const result = i18nMonitor.audit(i18n);
    setAuditResult(result);
  };

  const clearAllErrors = () => {
    i18nErrorManager.clearErrors();
    setErrors([]);
  };

  const downloadReport = () => {
    const report = i18nMonitor.generateReport(i18n);
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `i18n-report-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadErrorsJSON = () => {
    const json = i18nErrorManager.exportErrors();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `i18n-errors-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Ne pas afficher en production
  if (!import.meta.env.DEV) {
    return null;
  }

  const recentErrors = i18nErrorManager.getRecentErrors(5);
  const errorCounts = i18nErrorManager.getErrorCounts();

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        title="i18n Debug Panel"
      >
        🌐
        {errors.length > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {errors.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl w-96 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-bold">i18n Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* Status */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Status</h4>
              <div className="text-sm space-y-1">
                <div>
                  Locale: <span className="font-mono">{i18n.language}</span>
                </div>
                <div>
                  localStorage:{" "}
                  <span className="font-mono">
                    {localStorage.getItem("i18nextLng")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  Health:
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      i18nMonitor.healthCheck(i18n)
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {i18nMonitor.healthCheck(i18n) ? "OK" : "ERROR"}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Counts */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Error Counts</h4>
              <div className="text-sm space-y-1">
                {Object.entries(errorCounts).map(
                  ([type, count]) =>
                    count > 0 && (
                      <div key={type} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {type}:
                        </span>
                        <span className="font-bold text-red-600">{count}</span>
                      </div>
                    )
                )}
                {Object.values(errorCounts).every((c) => c === 0) && (
                  <div className="text-green-600">No errors</div>
                )}
              </div>
            </div>

            {/* Recent Errors */}
            {recentErrors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">
                  Recent Errors (last 5 min)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentErrors.map((error, index) => (
                    <div
                      key={index}
                      className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 rounded"
                    >
                      <div className="font-semibold text-red-800 dark:text-red-400">
                        {error.type}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 mt-1">
                        {error.message}
                      </div>
                      {error.key && (
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          Key: <code>{error.key}</code>
                        </div>
                      )}
                      <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        {error.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Result */}
            {auditResult && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Audit Result</h4>
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    Status:
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        auditResult.status === "OK"
                          ? "bg-green-100 text-green-800"
                          : auditResult.status === "WARNING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {auditResult.status}
                    </span>
                  </div>
                  {auditResult.issues.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold mb-1">Issues:</div>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {auditResult.issues.map((issue, index) => (
                          <li key={index} className="text-red-600">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-2">
                    <div className="font-semibold mb-1">Loaded Namespaces:</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {auditResult.details.loadedNamespaces.join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <button
              onClick={runAudit}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Run Audit
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={downloadReport}
                className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-sm"
              >
                Download Report
              </button>
              <button
                onClick={downloadErrorsJSON}
                className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-sm"
              >
                Export JSON
              </button>
            </div>
            <button
              onClick={clearAllErrors}
              className="w-full bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
              disabled={errors.length === 0}
            >
              Clear All Errors
            </button>
          </div>
        </div>
      )}
    </>
  );
}
