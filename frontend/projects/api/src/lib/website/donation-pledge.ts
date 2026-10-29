/** What Give monthly sends (L2-134 criterion 3): dollars a month, the donor's name and an email for the receipt. */
export interface DonationPledge {
  monthlyAmount: number | null;
  name: string;
  email: string;
}
