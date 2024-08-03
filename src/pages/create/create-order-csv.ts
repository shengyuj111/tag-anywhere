export type CableRequest = {
  quantity: number;
  cableName: string;
  length: number;
  stripLength: number;
};

export type NewOrderCSV = {
  companyName: string;
  cables: CableRequest[];
};
