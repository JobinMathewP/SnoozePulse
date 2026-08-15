import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatusCard } from '@/components/ui/StatusCard';
import { colors } from '@/theme';

describe('Button', () => {
  it('renders label, exposes accessibility, and handles press', async () => {
    const onPress = jest.fn();
    await render(
      <Button
        label="Retry"
        accessibilityLabel="Retry loading"
        onPress={onPress}
        testID="retry-btn"
      />,
    );
    expect(screen.getByLabelText('Retry loading')).toBeTruthy();
    fireEvent.press(screen.getByTestId('retry-btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button
        label="Retry"
        accessibilityLabel="Retry loading"
        onPress={onPress}
        disabled
        testID="retry-btn"
      />,
    );
    fireEvent.press(screen.getByTestId('retry-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('SegmentedControl', () => {
  it('announces tabs and changes selection', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        options={[
          { value: '7d', label: '7 Days', accessibilityLabel: 'Show last 7 days' },
          { value: '30d', label: '30 Days', accessibilityLabel: 'Show last 30 days' },
        ]}
        value="7d"
        onChange={onChange}
        testID="period"
      />,
    );
    fireEvent.press(screen.getByLabelText('Show last 30 days'));
    expect(onChange).toHaveBeenCalledWith('30d');
  });
});

describe('StatusCard', () => {
  it('uses theme foreground for titles and supports press', async () => {
    const onPress = jest.fn();
    await render(
      <StatusCard
        tone="alert"
        title="Microphone Access"
        subtitle="Open Settings"
        icon={<Text>icon</Text>}
        onPress={onPress}
        accessibilityLabel="Open system settings"
        testID="mic-card"
      />,
    );
    const title = screen.getByText('Microphone Access');
    const style = Array.isArray(title.props.style)
      ? Object.assign({}, ...title.props.style)
      : title.props.style;
    expect(style.color).toBe(colors.fg);
    fireEvent.press(screen.getByLabelText('Open system settings'));
    expect(onPress).toHaveBeenCalled();
  });
});
