import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

export interface ValidationRule<T = any> {
  validator: (value: T) => boolean | Promise<boolean>;
  message: string;
  debounceMs?: number;
}

export interface FieldValidation {
  isValid: boolean;
  isValidating: boolean;
  error: string | null;
  touched: boolean;
}

export interface FormValidationState {
  [fieldName: string]: FieldValidation;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: z.ZodSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [validationState, setValidationState] = useState<FormValidationState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Initialize validation state
  useEffect(() => {
    const initialState: FormValidationState = {};
    Object.keys(initialValues).forEach(key => {
      initialState[key] = {
        isValid: true,
        isValidating: false,
        error: null,
        touched: false,
      };
    });
    setValidationState(initialState);
  }, []);

  // Validate a single field
  const validateField = useCallback(async (
    fieldName: keyof T,
    value: any,
    schema?: z.ZodSchema
  ): Promise<FieldValidation> => {
    const currentValidation = validationState[fieldName as string] || {
      isValid: true,
      isValidating: false,
      error: null,
      touched: false,
    };

    // Set validating state
    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        ...currentValidation,
        isValidating: true,
      },
    }));

    try {
      // Use Zod schema validation if provided
      if (schema || validationSchema) {
        const schemaToUse = schema || validationSchema;
        if (schemaToUse) {
          // For single field validation, create a partial schema
          const fieldSchema = (schemaToUse as any).shape?.[fieldName];
          if (fieldSchema) {
            await fieldSchema.parseAsync(value);
          }
        }
      }

      const result: FieldValidation = {
        isValid: true,
        isValidating: false,
        error: null,
        touched: currentValidation.touched,
      };

      setValidationState(prev => ({
        ...prev,
        [fieldName]: result,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof z.ZodError 
        ? error.errors[0]?.message || 'Invalid value'
        : 'Validation failed';

      const result: FieldValidation = {
        isValid: false,
        isValidating: false,
        error: errorMessage,
        touched: currentValidation.touched,
      };

      setValidationState(prev => ({
        ...prev,
        [fieldName]: result,
      }));

      return result;
    }
  }, [validationState, validationSchema]);

  // Validate all fields
  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!validationSchema) return true;

    try {
      await validationSchema.parseAsync(values);
      
      // Mark all fields as valid
      const newState: FormValidationState = {};
      Object.keys(values).forEach(key => {
        newState[key] = {
          isValid: true,
          isValidating: false,
          error: null,
          touched: true,
        };
      });
      setValidationState(newState);
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newState: FormValidationState = { ...validationState };
        
        // Reset all fields to valid first
        Object.keys(values).forEach(key => {
          newState[key] = {
            ...newState[key],
            isValid: true,
            error: null,
            touched: true,
          };
        });

        // Set errors for invalid fields
        error.errors.forEach(err => {
          const fieldName = err.path[0] as string;
          if (fieldName) {
            newState[fieldName] = {
              isValid: false,
              isValidating: false,
              error: err.message,
              touched: true,
            };
          }
        });

        setValidationState(newState);
      }
      return false;
    }
  }, [values, validationSchema, validationState]);

  // Update field value with validation
  const setFieldValue = useCallback(async (
    fieldName: keyof T,
    value: any,
    shouldValidate: boolean = true
  ) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Mark field as touched
    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName as string],
        touched: true,
      },
    }));

    // Validate if requested and form has been submitted or field is touched
    if (shouldValidate && (submitCount > 0 || validationState[fieldName as string]?.touched)) {
      await validateField(fieldName, value);
    }
  }, [validateField, submitCount, validationState]);

  // Handle field blur
  const handleFieldBlur = useCallback(async (fieldName: keyof T) => {
    const currentValue = values[fieldName];
    
    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName as string],
        touched: true,
      },
    }));

    // Validate on blur
    await validateField(fieldName, currentValue);
  }, [values, validateField]);

  // Handle form submission
  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    try {
      const isValid = await validateForm();
      
      if (isValid) {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setSubmitCount(0);
    setIsSubmitting(false);
    
    const resetState: FormValidationState = {};
    Object.keys(initialValues).forEach(key => {
      resetState[key] = {
        isValid: true,
        isValidating: false,
        error: null,
        touched: false,
      };
    });
    setValidationState(resetState);
  }, [initialValues]);

  // Check if form is valid
  const isFormValid = Object.values(validationState).every(field => field.isValid);
  const hasErrors = Object.values(validationState).some(field => !field.isValid && field.touched);
  const isValidating = Object.values(validationState).some(field => field.isValidating);

  return {
    values,
    validationState,
    isSubmitting,
    isFormValid,
    hasErrors,
    isValidating,
    submitCount,
    setFieldValue,
    handleFieldBlur,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
  };
}

// Hook for auto-save functionality
export function useAutoSave<T>(
  values: T,
  onSave: (values: T) => Promise<void>,
  options: {
    delay?: number;
    enabled?: boolean;
    skipInitial?: boolean;
  } = {}
) {
  const { delay = 2000, enabled = true, skipInitial = true } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Skip initial save if requested
    if (skipInitial && !lastSaved) {
      setLastSaved(new Date());
      return;
    }

    setHasUnsavedChanges(true);

    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onSave(values);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [values, onSave, delay, enabled, skipInitial, lastSaved]);

  const forceSave = useCallback(async () => {
    if (!enabled || isSaving) return;

    try {
      setIsSaving(true);
      await onSave(values);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Force save failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [values, onSave, enabled, isSaving]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    forceSave,
  };
}
