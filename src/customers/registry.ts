/**
 * Customer Plugin Registry
 * To add a new customer: create src/customers/<name>/index.ts and add one entry here.
 * To remove a customer: delete the folder and remove the entry here.
 */
import { ComponentType } from 'react';
import niteraPlugin from './nitera';
import usuiPlugin   from './usui';

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

const REGISTRY: CustomerPlugin[] = [niteraPlugin, usuiPlugin];

export function getCustomerPlugin(strategyCode: string): CustomerPlugin | undefined {
  return REGISTRY.find(p => p.strategyCode === strategyCode);
}

export default REGISTRY;
