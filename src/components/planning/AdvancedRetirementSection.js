import React from 'react';
import AdvancedRetirementPlanner from '../finance/AdvancedRetirementPlanner';
import SectionNextStep from './SectionNextStep';

export default function AdvancedRetirementSection() {
  return (
    <div>
      <AdvancedRetirementPlanner />
      <SectionNextStep currentPath="advanced" />
    </div>
  );
}
