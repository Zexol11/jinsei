import { render, screen, fireEvent } from '@testing-library/react';
import TagInput, { Tag } from './TagInput';
import '@testing-library/jest-dom';

describe('TagInput Component', () => {
  const allTags: Tag[] = [
    { id: 1, name: 'javascript', slug: 'javascript' },
    { id: 2, name: 'react', slug: 'react' },
  ];

  it('renders correctly with no selected tags', () => {
    render(<TagInput allTags={allTags} selectedTags={[]} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('renders selected tags', () => {
    const selected = [{ id: 1, name: 'javascript', slug: 'javascript' }];
    render(<TagInput allTags={allTags} selectedTags={selected} onChange={jest.fn()} />);
    expect(screen.getByText('#javascript')).toBeInTheDocument();
  });

  it('shows suggestions based on input', () => {
    render(<TagInput allTags={allTags} selectedTags={[]} onChange={jest.fn()} />);
    
    // Type "re"
    fireEvent.change(screen.getByPlaceholderText('Add tags...'), { target: { value: 're' } });
    
    // Suggestion for react should appear
    expect(screen.getByText('#react')).toBeInTheDocument();
    // javascript should not
    expect(screen.queryByText('#javascript')).not.toBeInTheDocument();
  });

  it('allows creating a new tag and properly formats name', () => {
    const handleChange = jest.fn();
    render(<TagInput allTags={allTags} selectedTags={[]} onChange={handleChange} />);
    
    // Type a new tag name with caps and spaces
    fireEvent.change(screen.getByPlaceholderText('Add tags...'), { target: { value: ' New Tag ' } });
    
    // Create button should appear with formatted text
    const createBtn = screen.getByText(/Create/);
    expect(createBtn).toBeInTheDocument();
    
    // Using onMouseDown since that's what the component uses to avoid blur conflict
    fireEvent.mouseDown(createBtn);
    
    // Should call onChange with standard id: -1 and formatted name
    expect(handleChange).toHaveBeenCalledWith([
      { id: -1, name: 'new tag', slug: '' }
    ]);
  });

  it('blocks adding the same existing tag twice', () => {
    const selected = [{ id: 1, name: 'javascript', slug: 'javascript' }];
    const handleChange = jest.fn();
    
    render(<TagInput allTags={allTags} selectedTags={selected} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'javascript' } });
    
    // Try to create/add
    const createBtn = screen.getByText(/Create/);
    fireEvent.mouseDown(createBtn);
    
    // Should NOT call onChange
    expect(handleChange).not.toHaveBeenCalled();
    // Should show warning
    expect(screen.getByText('"javascript" is already added')).toBeInTheDocument();
  });

  it('blocks creating a new tag that shares a name with an already selected new tag', () => {
    // Both new tags have id: -1
    const selected = [{ id: -1, name: 'custom', slug: '' }];
    const handleChange = jest.fn();
    
    render(<TagInput allTags={allTags} selectedTags={selected} onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'custom' } });
    
    const createBtn = screen.getByText(/Create/);
    fireEvent.mouseDown(createBtn);
    
    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByText('"custom" is already added')).toBeInTheDocument();
  });

  it('removes only the specific new tag when clicking X, not all new tags', () => {
    const selected = [
      { id: -1, name: 'first-new', slug: '' },
      { id: -1, name: 'second-new', slug: '' }
    ];
    const handleChange = jest.fn();
    
    const { container } = render(<TagInput allTags={allTags} selectedTags={selected} onChange={handleChange} />);
    
    // The chips have an X button inside them
    // Let's find the remove button for 'first-new'
    // It's the first button inside the chip span
    const chips = container.querySelectorAll('span');
    expect(chips.length).toBe(2);
    
    const removeFirstBtn = chips[0].querySelector('button');
    fireEvent.click(removeFirstBtn!);
    
    // Should call onChange with only 'second-new' remaining
    expect(handleChange).toHaveBeenCalledWith([
      { id: -1, name: 'second-new', slug: '' }
    ]);
  });
});
