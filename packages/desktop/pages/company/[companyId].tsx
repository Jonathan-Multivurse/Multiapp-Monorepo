import Head from "next/head";
import { useRouter } from "next/router";

import CompanyPage from "../../app/components/templates/CompanyPage";
import { NextPageWithLayout } from "../../app/types/next-page";
import { useCompany } from "mobile/src/graphql/query/company";

const Company: NextPageWithLayout = () => {
  const router = useRouter();
  const { companyId } = router.query as Record<string, string>;
  const { data: companyData } = useCompany(companyId);
  const company = companyData?.companyProfile;

  return (
    <div>
      <Head>
        <title>
          {company ? company.name : "Company"} - Prometheus
        </title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {company && <CompanyPage company={company} />}
    </div>
  );
};

Company.layout = "main";
Company.middleware = "auth";

export default Company;
