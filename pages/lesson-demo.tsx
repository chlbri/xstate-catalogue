import CheckOutlined from '@material-ui/icons/CheckOutlined';
import { useMachine } from '@xstate/react';
import { lessonMachine } from '../lib/lessons/lessonRunner.machine';
import { paginationLesson } from '../lib/lessons/lessons/paginationLesson';
import classNames from 'classnames';
import CloseOutlined from '@material-ui/icons/CloseOutlined';
import dynamic from 'next/dynamic';

import { useRef } from 'react';
import type * as monaco from 'monaco-editor';
import { timerLesson } from '../lib/lessons/lessons/timerLesson';
import { textInputLesson } from '../lib/lessons/lessons/textInputLesson';

const Editor = dynamic(import('@monaco-editor/react'), { ssr: false });

const LESSON_TO_USE = timerLesson;

export const someValue = 'yes';

const LessonDemo = () => {
  const [state, send] = useMachine(lessonMachine, {
    context: {
      lesson: LESSON_TO_USE,
      fileText: LESSON_TO_USE.initialMachineText,
    },
  });

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);

  const { lesson, ...context } = state.context;

  return (
    <div className="flex items-stretch h-full p-6">
      <div className="flex-1">
        <Editor
          height="400px"
          language="typescript"
          onChange={(text) => {
            send({
              type: 'TEXT_EDITED',
              text,
            });
          }}
          onMount={async (editor, monaco) => {
            const [indexFile] = await Promise.all([
              fetch(`/xstate.txt`).then((res) => res.text()),
            ]);

            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              `${indexFile}`,
            );
          }}
          value={state.context.fileText}
        />
        <iframe data-xstate height="400px" width="100%" />
      </div>
      <div className="flex-1 px-6 space-y-10">
        {lesson.acceptanceCriteria.cases.map((acceptanceCase, caseIndex) => {
          return (
            <div className="max-w-md space-y-4">
              <h1 className="text-xl font-bold tracking-tight text-gray-800">
                Case #{caseIndex + 1}
              </h1>
              {acceptanceCase.steps.map((step, stepIndex) => {
                const stepTotal = Number(`${caseIndex}.${stepIndex}`);
                const cursorTotal = Number(
                  `${context.stepCursor?.case || 0}.${
                    context.stepCursor?.step || 0
                  }`,
                );
                let status: 'notComplete' | 'errored' | 'complete' =
                  'notComplete';
                if (
                  state.context.lastErroredStep?.step === stepIndex &&
                  state.context.lastErroredStep?.case === caseIndex
                ) {
                  status = 'errored';
                } else if (
                  state.hasTag('testsPassed') ||
                  stepTotal < cursorTotal
                ) {
                  status = 'complete';
                }
                return (
                  <div
                    className={classNames('font-medium border', {
                      'border-gray-200 text-gray-700 bg-gray-100':
                        status === 'notComplete',
                      'border-green-200 text-green-700 bg-green-100':
                        status === 'complete',
                      'border-red-200 text-red-700 bg-red-100':
                        status === 'errored',
                    })}
                  >
                    <div>
                      <div className="flex items-center p-2 px-3 space-x-3">
                        {status === 'errored' ? (
                          <CloseOutlined />
                        ) : status === 'complete' ? (
                          <CheckOutlined />
                        ) : (
                          <div style={{ width: 24 }} />
                        )}
                        {step.type === 'ASSERTION' && (
                          <div>
                            <p className="mb-1">{step.description}</p>
                            <p className="font-mono text-xs opacity-60">
                              {step.assertion.toString().slice(45, -5)}
                            </p>
                          </div>
                        )}
                        {step.type === 'SEND_EVENT' && (
                          <div>
                            <p className="mb-1">
                              Send a {step.event.type} event
                            </p>
                            <p className="font-mono text-xs opacity-60">
                              {JSON.stringify(step.event, null, 1)}
                            </p>
                          </div>
                        )}
                        {step.type === 'WAIT' && (
                          <div>
                            <p>Wait for {step.durationInMs}ms</p>
                            {/* <p className="font-mono text-xs opacity-60">
                              {JSON.stringify(step.event, null, 1)}
                            </p> */}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* {erroredStep && (
        <div className="p-6 bg-red-100">
          {erroredStep.type === 'ASSERTION' && (
            <p>Error: {erroredStep.description}</p>
          )}
        </div>
      )} */}
    </div>
  );
};

export default LessonDemo;
