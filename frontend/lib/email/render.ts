import { render } from '@react-email/render';
import React from 'react';

export async function renderEmailTemplate(component: React.FC<any>, props: any = {}): Promise<string> {
  const element = React.createElement(component, props);
  
  // Use React Email's render function which is designed for Next.js
  const html = await render(element);
  
  return html;
}