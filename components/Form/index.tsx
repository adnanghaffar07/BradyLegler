import { Children, cloneElement, isValidElement, useCallback, useRef, useState } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import classNames from '@/helpers/classNames';
import FieldBotCheck from '../Field/FieldBotCheck';
import FieldTurnstile, { useTurnstile } from '../Field/FieldTurnstile';
import styles from './styles.module.scss';

type FormProps = {
  className?: string;
  onSubmit?: (values: any, methods: any) => Promise<void>;
  defaultValues?: any;
  children: React.ReactNode;
  validationSchema?: any;
  formId?: string;
  submitText?: string;
  layout?: 'grid' | 'normal' | 'flex';
  theme?: 'primary' | 'secondary';
  /** Turnstile action, bound into the token so the server can tell forms apart. */
  turnstileAction?: string;
};

const Form = (props: FormProps) => {
  const {
    formId,
    className,
    onSubmit,
    children,
    layout = 'grid',
    defaultValues = {},
    theme = 'primary',
    turnstileAction
    // validationSchema = {},
  } = props;

  const methods: UseFormReturn = useForm({
    defaultValues
    // resolver: validationSchema
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  // How long the form was on screen before submission. Passed through to callers so
  // the server can reject implausibly fast (scripted) submissions.
  const renderedAtRef = useRef(Date.now());
  const turnstile = useTurnstile(turnstileAction);

  const onSubmitHandler = useCallback(
    async (values: any) => {
      if (values._gotcha) return;
      setIsSubmitting(true);

      // Either a Turnstile token or a flag saying the widget could not run. Never
      // blocks submission on its own - the server decides what each one means.
      const turnstileFields = await turnstile.getFields();

      if (onSubmit) {
        await onSubmit({ ...values, _elapsedMs: Date.now() - renderedAtRef.current, ...turnstileFields }, methods);
      }

      setIsSubmitting(false);
    },
    [onSubmit, methods, turnstile]
  );

  const classes = classNames(styles.form, styles[`theme_${theme}`], styles[`layout_${layout}`], className);
  return (
    <FormProvider {...methods}>
      <form id={formId} onSubmit={methods.handleSubmit(onSubmitHandler)} className={classes}>
        <FieldBotCheck register={methods?.register} />
        <FieldTurnstile containerRef={turnstile.containerRef} pending={turnstile.pending} />
        {Children.map(Children.toArray(children), child => {
          if (isValidElement(child))
            return cloneElement(child, {
              ...child.props,
              register: methods?.register,
              control: methods?.control,
              errors: methods?.formState?.errors
            });
          return child;
        })}
      </form>
    </FormProvider>
  );
};

export default Form;
