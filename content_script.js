const collapseSymbol = "[ - ]";
const expandSymbol = "[ + ]";
const access_token = "07d8a063d3d9c1f7533705fe12d37359de9a486e2fc8d4fc825f3d504d60b852";
const PageNamingConvention = "Page";
const ContentTypeSelector = ".x--medium-cell a";
const PaginationSelector = ".search-results-paginator__page";
const HeaderSelector = ".table__head table thead tr";
const ModuleColumnTitleSelector = "modulesColumnTitle";
const nestedModulesContainerVisiblityClass = "nestedModulesContainerHidden";

class ContentfulModules {
    /**
    Groups content entry view into page types and nests the associated `Modules` within each page
    **/
    async render() {
        var filterDropdownValue = document.querySelector("select").getAttribute("title");
        if(filterDropdownValue && (filterDropdownValue == "Any" || this.getLastWord(filterDropdownValue,' ') == PageNamingConvention)) {
            if(!document.getElementById(ModuleColumnTitleSelector)) {
                var header = document.querySelector(HeaderSelector);
                var th = document.createElement("th");
                th.innerHTML = "Modules";
                th.id = ModuleColumnTitleSelector;
                header.prepend(th);
            }       
            for(var contentType of document.querySelectorAll(ContentTypeSelector)) {
                var row = contentType.closest("tr");
                if (this.getLastWord(contentType.innerHTML,' ') != PageNamingConvention) {
                    row.parentNode.removeChild(row);
                } 
                else {
                    var td = document.createElement("td");
                    var expandButtonDiv = document.createElement("div");
                    expandButtonDiv.innerHTML = expandSymbol;
                    expandButtonDiv.className = "expandButton";
                    expandButtonDiv.onclick = function(e) {
                        e.stopPropagation();
                        if(e.target.className == expandButtonDiv.className) {
                            e.target.innerHTML = (e.target.innerHTML == expandSymbol) ? collapseSymbol : expandSymbol;
                            var siblingclassList = e.target.nextSibling.classList;
                            siblingclassList.contains(nestedModulesContainerVisiblityClass) ? 
                            siblingclassList.remove(nestedModulesContainerVisiblityClass) :
                            siblingclassList.add(nestedModulesContainerVisiblityClass);
                        }
                    };
                    td.append(expandButtonDiv);
                    var currentContentTypeUrl = contentType.href;
                    var previewApiUrl  = currentContentTypeUrl.replace("app","preview");
                    var currentEntryId = this.getLastWord(previewApiUrl,'/');
                    previewApiUrl = previewApiUrl.replace(currentEntryId,"?sys.id=" + currentEntryId + "&access_token=" + access_token + "&include=10");
                    await this.getModules("GET",previewApiUrl).then((entries)=> {
                        var entry = entries.items[0];
                        var modules = entry.fields.modules;
                        var nestedModulesContainer = document.createElement("div");
                            nestedModulesContainer.className = "nestedModulesContainer " + nestedModulesContainerVisiblityClass;
                            nestedModulesContainer.innerHTML = "<h3>Modules <em>( /" + entry.fields["slug"] + " )</em></h3>";
                        for(var module in modules) {
                            nestedModulesContainer.append(this.buildModuleLink(modules[module].sys.id,currentContentTypeUrl,entries.includes.Entry));
                        }
                        td.append(nestedModulesContainer);
                        row.prepend(td);
                    })
                }
            }
        }
    }

    buildModuleLink(moduleId,currentURL,includes) {
        var moduleLink  = document.createElement("a");
        moduleLink.href = currentURL.replace(this.getLastWord(currentURL,'/'),moduleId)
        moduleLink.innerHTML = this.getEntryTitleAndContentType(includes.find((includedEntry) => includedEntry.sys.id == moduleId));
        moduleLink.addEventListener("click", function(event) {
            event.stopPropagation();
        });
        return moduleLink;
    }

    getLastWord(word,symbol) {
        return word.split(symbol).pop();
    }

    getEntryTitleAndContentType(entry) {
        var entryTitleKeys = Object.keys(entry.fields).filter(key => key.indexOf("EntryTitle") > -1);
        for(var entryTitleKey of entryTitleKeys) {
            return entry.fields[entryTitleKey] + "<span class=\"contentType\"> ( "+ entry.sys.contentType.sys.id + " ) </span>";
        }
    }

    getModules(method, url) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest()
            xhr.open(method, url, true)
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    var payload = JSON.parse(xhr.response);
                    return resolve(payload);
                } else {
                    reject(Error({
                        status: xhr.status,
                        statusTextInElse: xhr.statusText
                    }))
                }
            }
            xhr.onerror = function() {
                reject(Error({
                    status: xhr.status,
                    statusText: xhr.statusText
                }))
            }
            setTimeout(function() {
                xhr.send()
            },50);
        })
    }

    registerListeners(timeOut) {
        var self = this;
        //nest modules under page after pagination
        document.querySelectorAll(PaginationSelector).forEach((paginateButton) => {
          paginateButton.addEventListener('click', () => {
            setTimeout(function() {
                self.render();
            },timeOut)
          });
        });

        //nest modules under page after content type dropdown is changed
        document.querySelector("select").addEventListener('change', () => {
            setTimeout(function() {
                self.render();
            },timeOut);
        });
    }
}

window.onload = function() {
    setTimeout(function() {
        let contentfulModules = new ContentfulModules();
        contentfulModules.registerListeners(2000);
        contentfulModules.render();
    },5000) 
}
