import { render, screen, fireEvent } from '@testing-library/react';
import MoodSelector from './MoodSelector';
import '@testing-library/jest-dom';

describe('MoodSelector Component', () => {
  const mockMoods = [
    { id: 1, label: 'terrible', emoji: '😔', value: 1 },
    { id: 2, label: 'bad', emoji: '😐', value: 2 },
    { id: 3, label: 'okay', emoji: '🙂', value: 3 },
  ];

  it('renders all mood options provided', () => {
    render(<MoodSelector moods={mockMoods} selectedMoodId={null} onSelect={jest.fn()} />);
    
    expect(screen.getByText('okay')).toBeInTheDocument();
    expect(screen.getByText('🙂')).toBeInTheDocument();
  });

  it('calls onSelect with the correct ID when a mood is clicked', () => {
    const handleSelect = jest.fn();
    render(<MoodSelector moods={mockMoods} selectedMoodId={null} onSelect={handleSelect} />);
    
    // Click the "okay" mood button
    fireEvent.click(screen.getByText('🙂'));
    
    // The ID for the "okay" mood is 3
    expect(handleSelect).toHaveBeenCalledWith(3);
  });
});
