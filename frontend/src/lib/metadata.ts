export type CredentialMetadata = {
  title: string;
  description: string;
  issuer?: string;
  issuedAt?: number;
  image?: string;
  links?: { label: string; url: string }[];
};

export function isCredentialMetadata(x: any): x is CredentialMetadata {
  return x && typeof x === 'object' && typeof x.title === 'string' && typeof x.description === 'string';
}

export function exampleMetadata(override?: Partial<CredentialMetadata>): CredentialMetadata {
  return {
    title: 'Completed Solidity Bootcamp (Q4 2025)',
    description: 'Completed 6-week Solidity bootcamp covering ERC-20/721/1155, Foundry tests, and gas optimization. Verified by OnchainAcademy (Nov 2025).',
    issuedAt: Date.now(),
    ...override,
  };
}
