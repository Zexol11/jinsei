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
    
    fireEvent.change(screen.getByPlaceholderText('Add tags...'), { target: { value: 're' } });
    
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.queryByText('#javascript')).not.toBeInTheDocument();
  });

  it('allows creating a new tag and properly formats name', () => {
    const handleChange = jest.fn();
    render(<TagInput allTags={allTags} selectedTags={[]} onChange={handleChange} />);
    
    fireEvent.change(screen.getByPlaceholderText('Add tags...'), { target: { value: ' New Tag ' } });
    
    const createBtn = screen.getByText(/Create/);
    expect(createBtn).toBeInTheDocument();
    
    fireEvent.mouseDown(createBtn);
    
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
    
    const createBtn = screen.getByText(/Create/);
    fireEvent.mouseDown(createBtn);
    
    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByText('"javascript" is already added')).toBeInTheDocument();
  });

  it('blocks creating a new tag that shares a name with an already selected new tag', () => {
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
