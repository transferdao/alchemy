import { IDAOState } from "@daostack/client";
import * as profilesActions from "actions/profilesActions";
import { getArc } from "arc";
import CreateProposalPage from "components/Proposal/Create/CreateProposalPage";
import ProposalDetailsPage from "components/Proposal/ProposalDetailsPage";
import SchemeContainer from "components/Scheme/SchemeContainer";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
//@ts-ignore
import { ModalRoute } from "react-router-modal";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { Subscription } from "rxjs";
import DaoSchemesPage from "./DaoSchemesPage";
import DaoHistoryPage from "./DaoHistoryPage";
import DaoMembersPage from "./DaoMembersPage";
import DaoRedemptionsPage from "./DaoRedemptionsPage";
import DaoSidebar from "./DaoSidebar";
import * as css from "./Dao.scss";

interface IStateProps extends RouteComponentProps<any> {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  dao: IDAOState;
  daoAvatarAddress: string;
  lastBlock: number;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    dao: ownProps.dao,
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
  };
};

interface IDispatchProps {
  getProfilesForAllAccounts: typeof profilesActions.getProfilesForAllAccounts;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  getProfilesForAllAccounts: profilesActions.getProfilesForAllAccounts,
  showNotification,
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  isLoading: boolean;
  dao: IDAOState;
  error: Error;
  complete: boolean;
}

class DaoContainer extends React.Component<IProps, IState> {
  public daoSubscription: any;
  public subscription: Subscription;

  constructor(props: IProps) {
    super(props);

    this.state = {
      isLoading: true,
      dao: undefined,
      error: undefined,
      complete: false,
    };
  }

  public async componentWillMount() {
    this.props.getProfilesForAllAccounts();
  }

  public render() {
    const { dao, currentAccountAddress } = this.props;

    return (
      <div className={css.outer}>
        <BreadcrumbsItem to={"/dao/" + dao.address}>{dao.name}</BreadcrumbsItem>
        <DaoSidebar currentAccountAddress={this.props.currentAccountAddress} dao={dao} />
        <div className={css.wrapper}>
          <div className={css.noticeWrapper}>
            <div className={css.noticeBuffer}></div>
            <div className={css.notice}>
              <div>
                <img src="/assets/images/Icon/notice.svg" />
                Alchemy and Arc are in Alpha. There will be BUGS! We don&apos;t guarantee complete security. *Play at your own risk*
              </div>
            </div>
          </div>
          <Switch>
            <Route exact path="/dao/:daoAvatarAddress/history"
              render={(props) => <DaoHistoryPage {...props} currentAccountAddress={currentAccountAddress} />} />
            <Route exact path="/dao/:daoAvatarAddress/members"
              render={(props) => <DaoMembersPage {...props} dao={dao} />} />
            <Route exact path="/dao/:daoAvatarAddress/redemptions"
              render={(props) =>
                <DaoRedemptionsPage {...props} dao={dao} currentAccountAddress={currentAccountAddress} />
              }
            />

            <Route exact path="/dao/:daoAvatarAddress/proposal/:proposalId"
              render={(props) =>
                <ProposalDetailsPage {...props}
                  dao={dao}
                  currentAccountAddress={currentAccountAddress}
                  proposalId={props.match.params.proposalId}
                />
              }
            />

            <Route path="/dao/:daoAvatarAddress/scheme/:schemeId"
              render={(props) => <SchemeContainer {...props} currentAccountAddress={currentAccountAddress} />} />

            <Route path="/dao/:daoAvatarAddress" render={(props) => <DaoSchemesPage {...props} />} />
          </Switch>

          <ModalRoute
            path="/dao/:daoAvatarAddress/scheme/:schemeId/proposals/create"
            parentPath={(route: any) => `/dao/${route.params.daoAvatarAddress}/scheme/${route.params.schemeId}/`}
            component={CreateProposalPage}
          />

        </div>
      </div>
    );
  }
}

const ConnectedDaoContainer = connect(mapStateToProps, mapDispatchToProps)(DaoContainer);

export default (props: RouteComponentProps<any>) => {
  const daoAddress = props.match.params.daoAvatarAddress;
  const arc = getArc();
  const dao = arc.dao(daoAddress);
  return <Subscribe observable={dao.state()}>{(state: IObservableState<IDAOState>) => {
    if (state.error) {
      return <div>{state.error.message}</div>;
    } else if (state.data) {
      return <ConnectedDaoContainer {...props} dao={state.data} />;
    } else {
      return (<div className={css.loading}><Loading/></div>);
    }
  }
  }</Subscribe>;
};
