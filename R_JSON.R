# This package is required for Accessing APIS (HTTP or HTTPS URLS from Web)
library(httr)
#This package exposes some additional functions to convert json/text to data frame
library(rlist)
#This package exposes some additional functions to convert json/text to data frame
library(jsonlite)
#This library is used to manipulate data
# library(purrr)
# library(tidyverse)

library(data.table)


r <- GET("http://realtimedata.water.nsw.gov.au/cgi/webservice.pl?%7B%22function%22:%22get_ts_traces%22,%22version%22:2,%22params%22:%7B%22site_list%22:%22210117%22,%22start_time%22:%2220161108000000%22,%22end_time%22:%2220161116000000%22,%22varfrom%22:%22130.00%22,%22varto%22:%22130.00%22,%22interval%22:%22day%22,%22datasource%22:%22CP%22,%22data_type%22:%22mean%22,%22multiplier%22:%221%22%7D%7D")#,
         # use_proxy("pri-proxy", port = 8080, username = '...', password = '...'), flatten=TRUE)

result <- fromJSON(content(r, as = "text", encoding = "utf-8") )

tmp<-result$`_return`

dfs<-lapply(tmp$traces, data.frame, stringsAsFactors=FALSE)
dfs2<-lapply(dfs, data.frame, stringsAsFactors=FALSE)
dfs3<-data.frame(dfs2)

dfs3$Date<-as.Date(as.character(as.numeric(dfs3$trace.t)/1000000), format="%Y%m%d")