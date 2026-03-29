type ResettableForm = {
  reset(): void;
};

export function resetSubmittedForm(form: ResettableForm | null | undefined) {
  form?.reset();
}
