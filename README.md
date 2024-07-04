# Childcare Resource Dashboard

This project utilizes data from `cc_cty_panel_.csv` and transforms it into three distinct datasets: `final_trend.csv`, `state_case.csv`, and `county_case.csv`. Below are the details for each dataset, including the columns and their descriptions.

## Original Data

### `cc_cty_panel_.csv`
- **state**: The state in which the data was collected.
- **cty_fips**: The FIPS code for the county.
- **year**: The year of the data.
- **pop04**: Population in each county & each year.
- **center_count_cc**: Count of child care centers.
- **capacity_total_cc**: Total capacity of child care centers.
- **center_count_fdh**: Count of family daycare homes.
- **capacity_total_fdh**: Total capacity of daycare homes.
- **center_count_other**: Count of other child care providers.
- **capacity_total_other**: Total capacity of other child care providers.
- **center_tot**: Total number of centers.
- **capacity_total**: Total capacity of all centers.
- **cc_desert**: Indicator showing if this area in this year is under the definition of childcare desert or not.

## Transformed Data

### 1. `final_trend.csv`
- **fips**: The FIPS code for the state.
- **Year**: The year of the data.
- **pop**: Population.
- **Total_CC**: Total capacity of child care centers.
- **FDH**: Total capacity of family day homes.
- **Other_CC**: Total capacity of other child care providers.

### 2. `state_case.csv`
- **State**: The state name code in which the data was collected.
- **Year**: The year of the data.
- **state_name**: Full name of the data column.
- **fips**: The FIPS code for the county.
- **Other_CC**: Total capacity of other child care providers.
- **FDH**: Total capacity of family day homes.
- **Total_CC**: Total capacity of child care centers.

### 3. `county_case.csv`
- **fips**: The FIPS code for the county.
- **County**: The county in which the data was collected.
- **State**: The state name code in which the data was collected.
- **Year**: The year of the data.
- **Other_CC**: Total capacity of other child care providers.
- **Total_CC**: Total capacity of child care centers.
- **FDH**: Total capacity of family day homes.

---

This document provides a brief overview of the datasets used in the dashboard project. For further details, refer to the original `cc_cty_panel_.csv` data file and the transformation scripts.
