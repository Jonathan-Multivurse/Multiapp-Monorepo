import { FC } from "react";

import CompanyItem from "./CompanyItem";
import { CompanyType } from "desktop/app/types/common-props";
import Skeleton from "./Skeleton";

interface CompaniesListProps {
  companies: CompanyType[] | undefined;
}

const CompaniesList: FC<CompaniesListProps> = ({ companies }) => {
  if (!companies) {
    return <Skeleton />;
  }
  if (companies.length == 0) {
    return <></>;
  }
  return (
    <>
      <div className="px-3 lg:px-0">
        <div className="text-xl text-white font-medium">Companies</div>
        <div className="divide-y divide-inherit border-white/[.12]">
          {companies.map((company, index) => (
            <div key={index} className="py-3">
              <CompanyItem company={company} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CompaniesList;
