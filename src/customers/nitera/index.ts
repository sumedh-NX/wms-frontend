import { ComponentType } from 'react';
import NiteraWorkflow from './NiteraWorkflow';
import { exportNiteraPDF } from './pdfExport';

export interface WorkflowProps {
  dispatchId: string;
  dispatch: any;
  onDispatchUpdate: (dispatch: any) => void;
  onMessage: (msg: { type: 'error' | 'success'; text: string }) => void;
}

export interface CustomerPlugin {
  strategyCode: string;
  displayName: string;
  Workflow: ComponentType<WorkflowProps>;
  exportPDF: (dispatch: any, logs: any[], bins: any[], picks: any[], parts: any[]) => void;
}

const niteraPlugin: CustomerPlugin = {
  strategyCode: 'NITERA_1to1',
  displayName:  'Nitera',
  Workflow:     NiteraWorkflow,
  exportPDF:    exportNiteraPDF,
};

export default niteraPlugin;
