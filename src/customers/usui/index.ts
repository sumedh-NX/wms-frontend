import { ComponentType } from 'react';
import UsuiWorkflow from './UsuiWorkflow';
import { exportUsuiPDF } from './pdfExport';

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

const usuiPlugin: CustomerPlugin = {
  strategyCode: 'USUI_1toMany',
  displayName:  'USUI',
  Workflow:     UsuiWorkflow,
  exportPDF:    exportUsuiPDF,
};

export default usuiPlugin;
