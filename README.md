# Childcare Resource Dashboard

This project utilizes data from `cc_cty_panel_.csv` and transforms it into three distinct datasets: `final_trend.csv`, `stateCase.csv`, and `countyCase.csv`. Below are the details for each dataset, including the columns and their descriptions.

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
- **stFips**: The FIPS code for states.
- **Year**: The year of the data.
- **pop**: Population.
- **Total_CC**: Total center of child care centers.
- **FDH**: Total center of family day homes.
- **Other_CC**: Total center of other child care providers.
- **state_name**: Full name of the data column.
- **state**: Short name of the data column.

### 2. `state_case.csv`
- **State**: The state name code in which the data was collected.
- **Year**: The year of the data.
- **state_name**: Full name of the data column.
- **Other_CC**: Total center of other child care providers.
- **FDH**: Total center of family day homes.
- **Total_CC**: Total center of child care centers.
- **stFips**: The FIPS code for states.
- **state**: Short name of the data column.

### 3. `county_case.csv`
- **County**: The county in which the data was collected.
- **State**: The state name code in which the data was collected.
- **Year**: The year of the data.
- **Other_CC**: Total center of other child care providers.
- **Total_CC**: Total center of child care centers.
- **FDH**: Total center of family day homes.
- **stFips**: The FIPS code for states.
- **cty_fips**: The FIPS code for counties.
- **state**: Short name of the data column.

`Please note that there is other metric available, such as capacity. We default center as the case metric. Users can change metric by changing varialbe **case_metric** in preprocess.py file.`

### Mapping data
- **state_fips.csv**
- **counties_fips.csv**

### Geography data
- **us-smaller.json**
- **us.json**

---

This document provides a brief overview of the datasets used in the dashboard project. For further details, refer to the original `cc_cty_panel_.csv` data file and the transformation scripts `preprocess.py`.
