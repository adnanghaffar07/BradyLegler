import { Children, cloneElement, isValidElement, useCallback, useState } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import classNames from '@/helpers/classNames';
import FieldBotCheck from '../Field/FieldBotCheck';
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
};

const Form = (props: FormProps) => {
  const {
    formId,
    className,
    onSubmit,
    children,
    layout = 'grid',
    defaultValues = {},
    theme = 'primary'
    // validationSchema = {},
  } = props;

  const methods: UseFormReturn = useForm({
    defaultValues
    // resolver: validationSchema
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmitHandler = useCallback(
    async (values: any) => {
      if (values._gotcha) return;
      setIsSubmitting(true);
      if (onSubmit) await onSubmit(values, methods);
      setIsSubmitting(false);
    },
    [onSubmit, methods]
  );

  const classes = classNames(styles.form, styles[`theme_${theme}`], styles[`layout_${layout}`], className);
  return (
    <FormProvider {...methods}>
      <form id={formId} onSubmit={methods.handleSubmit(onSubmitHandler)} className={classes}>
        <FieldBotCheck register={methods?.register} />
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
