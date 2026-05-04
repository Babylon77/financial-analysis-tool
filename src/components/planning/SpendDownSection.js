import React from 'react';
import SpendDown from '../../pages/SpendDown';
import SectionNextStep from './SectionNextStep';

export default function SpendDownSection() {
  return (
    <div>
      <SpendDown />
      <SectionNextStep currentPath="spend-down" />
    </div>
  );
}
