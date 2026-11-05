import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'

import LSM_Write from './Making_Your_Own_TSDB/LSM_Write'
import LSM_Read from './Making_Your_Own_TSDB/LSM_Read'
import LSM_Components from './Making_Your_Own_TSDB/LSM_Components'
import LSM_Memtable from './Making_Your_Own_TSDB/LSM_Memtable'
import LSM_SST from './Making_Your_Own_TSDB/LSM_SST'
import LSM_TSST from './Making_Your_Own_TSDB/LSM_TSST'
import LSM_WAL from './Making_Your_Own_TSDB/LSM_WAL'
import LSM_Compaction from './Making_Your_Own_TSDB/LSM_Compaction'


export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  LSM_Write,
  LSM_Read,
  LSM_Components,
  LSM_Memtable,
  LSM_SST,
  LSM_TSST,
  LSM_WAL,
  LSM_Compaction
}
