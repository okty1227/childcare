import pandas as pd
import os

## load raw data
raw_data = pd.read_csv("./data/cc_cty_panel_.csv")
# raw_data_cols = raw_data.columns
raw_df = raw_data.fillna(0)

## mapping files
stfips = pd.read_csv("./data/state_fips.csv")  # state
countyfips = pd.read_csv("./data/counties_fips.csv")  # county

case_metric = {
    "center_count_cc": "Total_CC",
    "center_count_fdh": "FDH",
    "center_count_other": "Other_CC",
}

county_col_mapper = {
    "Year": "Year",
    "center_count_cc": "Total_CC",
    "center_count_fdh": "FDH",
    "center_count_other": "Other_CC",
    "state": "State",
    "county_name": "County",
    "cty_fips": "cty_fips",
}
county_col_full_mapper = {**case_metric, **county_col_mapper}

trend_col_mapper = {
    "stFips": "stFips",
    "Year": "Year",
    "state_name": "state_name",
    "state": "state",
    "pop4": "pop",
}
trend_col_full_mapper = {**case_metric, **trend_col_mapper}

state_col_mapper = {"Year": "Year", "stFips": "stFips"}
state_col_full_mapper = {**case_metric, **state_col_mapper}

min_year = 2000
max_year = 2024

# map with state data and county data
# fips & name mapping
raw_df['pop04'] = raw_df['pop04']/1000
raw_data_full = pd.merge(left=raw_df, right=stfips, on=["stFips"])
raw_data_full = raw_data_full.merge(countyfips, on=["cty_fips", "state"])

## county map data
county_full_raw = raw_data_full[county_col_full_mapper.keys()]
county_df = county_full_raw.rename(columns=county_col_full_mapper)
county_df.to_csv("countyCaseData.csv", index=False)

## trend data
trend_cols = ["pop04", "center_count_cc", "center_count_fdh", "center_count_other"]
trend_data_grouped = raw_data_full.groupby(
    by=["stFips", "Year", "state_name", "state"]
).sum()[trend_cols]

trend_idxs = trend_data_grouped.index

inusefips = set(stfips["stFips"])
in_data_state = set(trend_data_grouped.index.get_level_values(level="stFips"))

trend_data_grouped = trend_data_grouped.reset_index(["state_name", "state"])

for state in inusefips:
    prev_pop = 0
    prev_total = 0
    prev_other = 0
    prev_fdh = 0
    for yr in range(min_year, max_year, 1):
        pair = (state, yr)

        if pair not in trend_idxs:

            trend_data_grouped.loc[(state, yr), "pop04"] = prev_pop
            trend_data_grouped.loc[(state, yr), "center_count_cc"] = prev_total
            trend_data_grouped.loc[(state, yr), "center_count_fdh"] = prev_other
            trend_data_grouped.loc[(state, yr), "center_count_other"] = prev_fdh
        else:
            prev_pop = trend_data_grouped.loc[(state, yr), "pop04"]
            prev_total = trend_data_grouped.loc[(state, yr), "center_count_cc"]
            prev_other = trend_data_grouped.loc[(state, yr), "center_count_fdh"]
            prev_fdh = trend_data_grouped.loc[(state, yr), "center_count_other"]

trend_data = trend_data_grouped.reset_index()
trend_data.rename(columns=trend_col_full_mapper, inplace=True)

trend_data.to_csv("final_trend.csv", index=False)

# state data
# the number of data is selected to show on the dashboard
state_cols = ["center_count_cc", "center_count_fdh", "center_count_other"]

state_df = raw_data_full.groupby(by=["stFips", "Year"]).sum()[state_cols]

in_data_state = set(state_df.index.get_level_values(level="stFips"))

# fill state with lacked yearly data 0
# iterate every state & year pair
for idx, row in stfips[["stFips", "state_name", "state"]].iterrows():
    prev_pop = 0
    prev_total = 0
    prev_other = 0
    prev_fdh = 0
    state_name = row["state_name"]
    state = row["state"]
    state_fip = row["stFips"]

    for yr in range(min_year, max_year + 1, 1):
        pair = (state_fip, yr)
        state_df.loc[(state_fip, yr), "state_name"] = state_name
        state_df.loc[(state_fip, yr), "state"] = state
        if pair not in state_df.index:

            state_df.loc[(state_fip, yr), "center_count_cc"] = prev_total
            state_df.loc[(state_fip, yr), "center_count_fdh"] = prev_other
            state_df.loc[(state_fip, yr), "center_count_other"] = prev_fdh

        else:
            prev_total = state_df.loc[(state_fip, yr), "center_count_cc"]
            prev_other = state_df.loc[(state_fip, yr), "center_count_fdh"]
            prev_fdh = state_df.loc[(state_fip, yr), "center_count_other"]


state_df.reset_index(inplace=True)
state_df.rename(columns=state_col_full_mapper, inplace=True)
state_df.to_csv("stateCaseData.csv")
