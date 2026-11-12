// A blank listing cell is not evidence that a date verified in the notice was withdrawn.
export function mergeGovernmentListing(previous, incoming) {
 const merged = {...previous, ...incoming};
 const evidence = previous?.applicationDateEvidence;
 if (evidence?.checkedAt && evidence?.reference) {
  let datesChanged = false;
  for (const field of ['applicationStartDate', 'applicationEndDate']) {
   if (incoming[field] == null && previous[field]) merged[field] = previous[field];
   if (incoming[field] != null && incoming[field] !== previous[field]) datesChanged = true;
  }
  if (datesChanged) {
   // Keep the former proof for review; it does not verify a newly listed date.
   merged.previousApplicationDateEvidence = evidence;
   merged.applicationDateEvidence = null;
  }
 }
 return merged;
}
