import { getJetStreamClient, sc, SubjectsType } from '@events/index';
import { log } from '@jym272ticketing/common/dist/utils';

export const publish = async (subj: SubjectsType, pseudoSentence: string) => {
  const js = await getJetStreamClient();
  const pa = await js.publish(subj, sc.encode(pseudoSentence));
  const { stream, seq, duplicate } = pa;
  log(`[${stream}][${seq}][${duplicate.toString()}]: ${pseudoSentence}`);
};
