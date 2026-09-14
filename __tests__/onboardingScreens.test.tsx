import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  createInitialOnboardingState,
  onboardingReducer,
  type OnboardingFlowState,
} from '../src/auth/onboardingReducer';
import { ONBOARDING_COPY } from '../src/auth/onboardingErrors';
import { OnboardingApiError, onboardingApi } from '../src/services/onboardingApi';
import AccountCompletionScreen from '../src/screens/onboarding/AccountCompletionScreen';
import {
  OnboardingFlowProvider,
  useOnboardingFlow,
} from '../src/screens/onboarding/OnboardingFlowProvider';
import OtpVerificationScreen from '../src/screens/onboarding/OtpVerificationScreen';
import PhoneEntryScreen from '../src/screens/onboarding/PhoneEntryScreen';
import TraineeTypeScreen from '../src/screens/onboarding/TraineeTypeScreen';

jest.mock('../src/screens/components/ThemedBackground', () => {
  const MockReact = require('react');
  const { View: MockView } = require('react-native');
  return ({ children }: any) => MockReact.createElement(MockView, null, children);
});

jest.mock('../src/services/onboardingApi', () => {
  const actual = jest.requireActual('../src/services/onboardingApi');
  return {
    ...actual,
    onboardingApi: {
      start: jest.fn(),
      resend: jest.fn(),
      verify: jest.fn(),
      complete: jest.fn(),
      bootstrap: jest.fn(),
    },
  };
});

const mockedApi = onboardingApi as jest.Mocked<typeof onboardingApi>;
const navigation = () => ({
  navigate: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  getParent: jest.fn(() => null),
});

const session = {
  ok: true as const,
  message: 'neutral',
  session_token: 'session-secret',
  expires_in: 300,
  resend_after: 20,
};

const otpState = (now = Date.now()): OnboardingFlowState =>
  onboardingReducer(createInitialOnboardingState(), {
    type: 'START_SUCCEEDED',
    response: session,
    now,
  });

const completeState = (): OnboardingFlowState =>
  onboardingReducer(otpState(), {
    type: 'VERIFY_SUCCEEDED',
    response: {
      ok: true,
      verified: true,
      session_token: 'verified-secret',
      next_action: 'complete_registration',
    },
  });

describe('phone onboarding screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('shows two UI-only trainee choices that lead to the same phone step without API calls', async () => {
    const newNav = navigation();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<TraineeTypeScreen navigation={newNav} />);
    });

    await act(async () => renderer.root.findByProps({ testID: 'new-trainee-option' }).props.onPress());
    expect(newNav.navigate).toHaveBeenCalledWith('PhoneEntry');
    expect(mockedApi.start).not.toHaveBeenCalled();

    const previousNav = navigation();
    await act(async () => {
      renderer.update(<TraineeTypeScreen navigation={previousNav} />);
    });
    await act(async () => renderer.root.findByProps({ testID: 'previous-trainee-option' }).props.onPress());
    expect(previousNav.navigate).toHaveBeenCalledWith('PhoneEntry');
    expect(mockedApi.start).not.toHaveBeenCalled();
  });

  it('retries a transient Start failure with the same per-gesture key', async () => {
    mockedApi.start
      .mockRejectedValueOnce(new OnboardingApiError('temporarily_unavailable', 503))
      .mockResolvedValueOnce(session);
    const nav = navigation();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <OnboardingFlowProvider>
          <PhoneEntryScreen navigation={nav} />
        </OnboardingFlowProvider>,
      );
    });

    await act(async () => {
      renderer.root.findByProps({ testID: 'mobile-input' }).props.onChangeText('0912345678');
    });
    await act(async () => {
      await renderer.root.findByProps({ testID: 'start-button' }).props.onPress();
    });
    expect(renderer.root.findByProps({ testID: 'onboarding-error' })).toBeTruthy();

    await act(async () => {
      await renderer.root.findByProps({ testID: 'retry-start-button' }).props.onPress();
    });

    expect(mockedApi.start).toHaveBeenCalledTimes(2);
    expect(mockedApi.start.mock.calls[1][1]).toBe(mockedApi.start.mock.calls[0][1]);
    expect(nav.replace).toHaveBeenCalledWith('OtpVerification');
  });

  it('keeps the flag country picker and mobile field together and sends the selected dial code', async () => {
    mockedApi.start.mockResolvedValue(session);
    const nav = navigation();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <OnboardingFlowProvider>
          <PhoneEntryScreen navigation={nav} />
        </OnboardingFlowProvider>,
      );
    });

    expect(renderer.root.findByProps({ testID: 'country-picker-button' })).toBeTruthy();
    await act(async () => {
      renderer.root.findByProps({ testID: 'country-picker-button' }).props.onPress();
    });
    await act(async () => {
      renderer.root.findByProps({ testID: 'country-option-AE' }).props.onPress();
      renderer.root.findByProps({ testID: 'mobile-input' }).props.onChangeText('0501234567');
    });
    await act(async () => {
      await renderer.root.findByProps({ testID: 'start-button' }).props.onPress();
    });

    expect(mockedApi.start).toHaveBeenCalledWith(
      { country_code: '971', mobile: '501234567' },
      expect.any(String),
    );
  });

  it('shows only neutral reachability copy and enforces the resend deadline', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000);
    const nav = navigation();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <OnboardingFlowProvider initialState={otpState(1_000_000)}>
          <OtpVerificationScreen navigation={nav} />
        </OnboardingFlowProvider>,
      );
    });

    const renderedText = renderer.root.findAllByType(Text).map(node => node.props.children).flat().join(' ');
    expect(renderedText).toContain(ONBOARDING_COPY.neutralCodeSent.ar);
    expect(renderer.root.findByProps({ testID: 'resend-button' }).props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(20_000);
    });
    expect(renderer.root.findByProps({ testID: 'resend-button' }).props.accessibilityState.disabled).toBe(false);
    await act(async () => renderer.unmount());
  });

  it('shows only a password field after verification and sends no trainee-selection data', async () => {
    mockedApi.complete.mockResolvedValue({
      ok: true,
      access_token: 'access-secret',
      user_id: 1,
      profile_id: 2,
      student_id: null,
      link_status: 'unlinked',
    });
    const nav = navigation();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <OnboardingFlowProvider initialState={completeState()}>
          <AccountCompletionScreen navigation={nav} />
        </OnboardingFlowProvider>,
      );
    });

    await act(async () => {
      renderer.root.findByProps({ testID: 'password-input' }).props.onChangeText('password-123');
    });
    await act(async () => {
      await renderer.root.findByProps({ testID: 'complete-button' }).props.onPress();
    });

    expect(mockedApi.complete).toHaveBeenCalledWith({
      session_token: 'verified-secret',
      password: 'password-123',
    });
  });

  it('calls the injected secure-session handler before clearing a successful flow', async () => {
    const result = {
      ok: true as const,
      access_token: 'access-secret',
      user_id: 1,
      profile_id: 2,
      student_id: 77,
      link_status: 'linked' as const,
    };
    mockedApi.complete.mockResolvedValue(result);
    const onSuccess = jest.fn().mockResolvedValue(undefined);
    const readyState = completeState();

    function CompletionHarness() {
      const { state, complete } = useOnboardingFlow();
      return (
        <View>
          <Text testID="flow-step">{state.step}</Text>
          <TouchableOpacity
            testID="seed-and-complete"
            onPress={() => complete('password-123')}
          />
        </View>
      );
    }

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <OnboardingFlowProvider initialState={readyState} onSuccess={onSuccess}>
          <CompletionHarness />
        </OnboardingFlowProvider>,
      );
    });
    await act(async () => {
      await renderer.root.findByProps({ testID: 'seed-and-complete' }).props.onPress();
    });

    expect(onSuccess).toHaveBeenCalledWith(result);
    expect(renderer.root.findByProps({ testID: 'flow-step' }).props.children).toBe('phone');
  });
});
