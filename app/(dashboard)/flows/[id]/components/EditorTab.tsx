"use client";

interface Step {
  id: string;
  title: string;
  description: string;
}

interface Props {
  steps: Step[];
  editingStepId: string | null;
  publishing: boolean;
  publishError: string;
  onAddStep: () => void;
  onRemoveStep: (id: string) => void;
  onUpdateStep: (id: string, updates: Partial<Step>) => void;
  onReorderSteps: (from: number, to: number) => void;
  onSelectStep: (id: string | null) => void;
  onPublish: () => void;
}

export function EditorTab({
  steps,
  editingStepId,
  publishing,
  publishError,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onReorderSteps,
  onSelectStep,
  onPublish,
}: Props) {
  const editingStep = steps.find((s) => s.id === editingStepId);

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold mb-4">Steps ({steps.length})</h2>
          <div className="space-y-3 mb-4">
            {steps.length === 0 ? (
              <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">No steps yet</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Each step is a screen your users will see. Add a title and description, then publish when ready.
                </p>
              </div>
            ) : (
              steps.map((step, index) => (
                <div
                  key={step.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => onSelectStep(step.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-400 text-sm">Step {index + 1}</span>
                        <h3 className="font-medium">{step.title}</h3>
                      </div>
                      {step.description && (
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {index > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onReorderSteps(index, index - 1); }}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                          title="Move up"
                        >
                          ↑
                        </button>
                      )}
                      {index < steps.length - 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onReorderSteps(index, index + 1); }}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                          title="Move down"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveStep(step.id); }}
                        className="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={onAddStep}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm"
          >
            + Add Step
          </button>
        </div>
      </div>

      <div className="col-span-1">
        <div className="bg-white rounded-lg border p-6 sticky top-20">
          {editingStep ? (
            <>
              <h2 className="text-lg font-bold mb-4">Edit Step</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Title *</label>
                  <input
                    type="text"
                    value={editingStep.title}
                    onChange={(e) => onUpdateStep(editingStep.id, { title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    placeholder="Step title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                  <textarea
                    value={editingStep.description}
                    onChange={(e) => onUpdateStep(editingStep.id, { description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none h-20 resize-none"
                    placeholder="Optional description"
                  />
                </div>
                <button
                  onClick={() => onSelectStep(null)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm"
                >
                  Done Editing
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-4">Publish</h2>
              {publishError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                  {publishError}
                </div>
              )}
              <p className="text-sm text-gray-600 mb-4">
                {steps.length === 0
                  ? "Add at least one step to publish."
                  : steps.some((s) => !s.title.trim())
                  ? "All steps need titles."
                  : `Ready to publish ${steps.length} step${steps.length !== 1 ? "s" : ""}. This will make your flow live.`}
              </p>
              <button
                onClick={onPublish}
                disabled={steps.length === 0 || steps.some((s) => !s.title.trim()) || publishing}
                className="w-full py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
              >
                {publishing ? "Publishing..." : "Publish Flow"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
